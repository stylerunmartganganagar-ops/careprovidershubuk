-- Add username column to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Create conversations table
CREATE TABLE conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    participants UUID[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_conversations_participants ON conversations USING GIN(participants);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view conversations they participate in" ON conversations
    FOR SELECT USING (auth.uid() = ANY(participants));

CREATE POLICY "Users can create conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = ANY(participants));

CREATE POLICY "Users can update conversations they participate in" ON conversations
    FOR UPDATE USING (auth.uid() = ANY(participants));

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND auth.uid() = ANY(conversations.participants)
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = messages.conversation_id
            AND auth.uid() = ANY(conversations.participants)
        )
    );

-- Function to update conversation updated_at when new message is added
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp
CREATE TRIGGER trigger_update_conversation_updated_at
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- Function to create or get conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(user1_id UUID, user2_id UUID)
RETURNS UUID AS $$
DECLARE
    conv_id UUID;
BEGIN
    -- Try to find existing conversation
    SELECT id INTO conv_id
    FROM conversations
    WHERE participants @> ARRAY[user1_id, user2_id]
       OR participants @> ARRAY[user2_id, user1_id]
    LIMIT 1;

    -- If no conversation exists, create one
    IF conv_id IS NULL THEN
        INSERT INTO conversations (participants)
        VALUES (ARRAY[user1_id, user2_id])
        RETURNING id INTO conv_id;
    END IF;

    RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add a comment
COMMENT ON COLUMN users.username IS 'Unique username generated from adjective + noun + number combination';

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS bid_tokens INTEGER NOT NULL DEFAULT 0;

-- Token plan catalog for seller bidding tokens
CREATE TABLE IF NOT EXISTS token_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    tokens INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    active_purchases INTEGER NOT NULL DEFAULT 0,
    total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_plans_is_active ON token_plans(is_active);

ALTER TABLE token_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Anyone can read active token plans" ON token_plans
    FOR SELECT
    USING (is_active);

-- Function to keep updated_at current
CREATE OR REPLACE FUNCTION update_token_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_token_plans_updated_at ON token_plans;
CREATE TRIGGER trg_update_token_plans_updated_at
    BEFORE UPDATE ON token_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_token_plans_updated_at();

-- Seed default plans (idempotent)
INSERT INTO token_plans (slug, name, description, tokens, price, currency, is_popular)
VALUES
    ('starter-pack', 'Starter Pack', 'Perfect for trying out the platform', 10, 9.99, 'GBP', FALSE),
    ('professional-pack', 'Professional Pack', 'Most popular choice for active sellers', 50, 39.99, 'GBP', TRUE),
    ('enterprise-pack', 'Enterprise Pack', 'Best value for high-volume sellers', 200, 149.99, 'GBP', FALSE)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    tokens = EXCLUDED.tokens,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    is_popular = EXCLUDED.is_popular,
    is_active = TRUE;

-- Seller token purchases (auditable ledger)
CREATE TABLE IF NOT EXISTS token_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES token_plans(id) ON DELETE RESTRICT,
    tokens INTEGER NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'GBP',
    status TEXT NOT NULL DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_purchases_seller ON token_purchases(seller_id);
CREATE INDEX IF NOT EXISTS idx_token_purchases_plan ON token_purchases(plan_id);

ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Sellers can view their token purchases" ON token_purchases
    FOR SELECT
    USING (auth.uid() = seller_id);

CREATE POLICY IF NOT EXISTS "Sellers can record their token purchases" ON token_purchases
    FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

-- Function to record purchase atomically
CREATE OR REPLACE FUNCTION record_token_purchase(p_seller_id UUID, p_plan_slug TEXT)
RETURNS token_purchases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    plan_rec token_plans%ROWTYPE;
    purchase_rec token_purchases%ROWTYPE;
BEGIN
    SELECT * INTO plan_rec
    FROM token_plans
    WHERE slug = p_plan_slug
      AND is_active
    LIMIT 1;

    IF plan_rec.id IS NULL THEN
        RAISE EXCEPTION 'PLAN_NOT_FOUND' USING ERRCODE = 'P0001';
    END IF;

    IF auth.uid() IS NULL OR auth.uid() <> p_seller_id THEN
        RAISE EXCEPTION 'NOT_AUTHORIZED' USING ERRCODE = '28000';
    END IF;

    INSERT INTO token_purchases (seller_id, plan_id, tokens, amount, currency)
    VALUES (p_seller_id, plan_rec.id, plan_rec.tokens, plan_rec.price, plan_rec.currency)
    RETURNING * INTO purchase_rec;

    UPDATE users
    SET bid_tokens = COALESCE(bid_tokens, 0) + plan_rec.tokens
    WHERE id = p_seller_id;

    UPDATE token_plans
    SET active_purchases = active_purchases + 1,
        total_revenue = total_revenue + plan_rec.price,
        updated_at = NOW()
    WHERE id = plan_rec.id;

    RETURN purchase_rec;
END;
$$;
