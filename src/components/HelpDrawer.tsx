import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import {
  HelpCircle,
  Search,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Phone,
  Mail,
  ExternalLink,
  FileText,
  CreditCard,
  Shield,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDrawer({ open, onOpenChange }: HelpDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: HelpCircle,
      content: [
        {
          question: 'How do I create an account?',
          answer: 'Click the "Sign Up" button in the top right corner. Choose whether you\'re a buyer (looking for healthcare services) or seller (providing healthcare services). Fill out your basic information and verify your email.'
        },
        {
          question: 'What types of healthcare services are available?',
          answer: 'Our platform specializes in healthcare compliance and regulatory services including CQC registration, compliance audits, care home licensing, training services, accounting, and immigration support for healthcare professionals.'
        },
        {
          question: 'How do I post a project?',
          answer: 'Navigate to your dashboard and click "Post a Project" in the quick actions. Fill in your project details, budget, timeline, and requirements. Your project will be reviewed before being published.'
        }
      ]
    },
    {
      id: 'buying-services',
      title: 'Finding & Buying Services',
      icon: Search,
      content: [
        {
          question: 'How do I search for services?',
          answer: 'Use the search bar in the header to search by keywords like "CQC Registration" or "compliance audit". You can also filter by location and browse categories.'
        },
        {
          question: 'What should I look for in a service provider?',
          answer: 'Check their rating, number of reviews, completion rate, and response time. Look at their portfolio and certifications. Read reviews from previous clients.'
        },
        {
          question: 'How do I place an order?',
          answer: 'Select a service, review the provider\'s profile, then click "Contact Provider" or "Place Order". Provide your project details and requirements.'
        },
        {
          question: 'What payment methods are accepted?',
          answer: 'We accept major credit cards, PayPal, and bank transfers. All payments are held in escrow until project completion.'
        }
      ]
    },
    {
      id: 'selling-services',
      title: 'Providing Services',
      icon: Users,
      content: [
        {
          question: 'How do I become a service provider?',
          answer: 'Sign up as a seller, complete your profile with your expertise, certifications, and experience. Add services to your portfolio and set your rates.'
        },
        {
          question: 'How do I create a service listing?',
          answer: 'Go to your seller dashboard and click "Create Service". Fill in the service details, pricing, and requirements. Add up to 5 keywords for better discoverability.'
        },
        {
          question: 'How do I manage my portfolio?',
          answer: 'Use the "Manage Portfolio" section to add, edit, and organize your work samples. Include before/after examples, case studies, and project outcomes.'
        },
        {
          question: 'What are the fees for sellers?',
          answer: 'We charge a 10% platform fee on completed projects. There are no setup fees or monthly subscriptions. Premium sellers get featured placement.'
        }
      ]
    },
    {
      id: 'account-billing',
      title: 'Account & Billing',
      icon: CreditCard,
      content: [
        {
          question: 'How do I update my payment methods?',
          answer: 'Go to your account settings and navigate to "Payment Methods". You can add, remove, or update your credit cards and bank accounts.'
        },
        {
          question: 'When do I get paid?',
          answer: 'Payments are released 7 days after project completion to allow for any revisions. Funds are transferred to your linked bank account or PayPal.'
        },
        {
          question: 'What if I need to cancel an order?',
          answer: 'Contact our support team within 24 hours of placing the order. Cancellations after work has begun may incur fees. Refunds are processed within 5-7 business days.'
        },
        {
          question: 'How do I dispute a transaction?',
          answer: 'Use the dispute resolution system in your order details. Provide evidence and our team will mediate between both parties.'
        }
      ]
    },
    {
      id: 'safety-security',
      title: 'Safety & Security',
      icon: Shield,
      content: [
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, we use industry-standard encryption and PCI-compliant payment processing. We never store your full credit card information.'
        },
        {
          question: 'How do you verify service providers?',
          answer: 'All providers undergo background checks, certification verification, and identity confirmation. We also monitor reviews and performance.'
        },
        {
          question: 'What if I\'m not satisfied with a service?',
          answer: 'Contact our support team immediately. We offer revision requests and, in cases of significant issues, full refunds through our satisfaction guarantee.'
        },
        {
          question: 'How do you protect my data?',
          answer: 'We comply with GDPR and healthcare data protection regulations. Your personal information is encrypted and never shared without your consent.'
        }
      ]
    },
    {
      id: 'contact-support',
      title: 'Contact & Support',
      icon: MessageSquare,
      content: [
        {
          question: 'How do I contact customer support?',
          answer: 'Use the live chat in the bottom right corner, email us at support@providershub.com, or call our helpline at +44 20 1234 5678.'
        },
        {
          question: 'What are your support hours?',
          answer: 'Our support team is available Monday-Friday 9 AM - 6 PM GMT, and Saturday 10 AM - 4 PM GMT. Emergency support is available 24/7 for critical issues.'
        },
        {
          question: 'How long does it take to get a response?',
          answer: 'Email responses within 24 hours, live chat within minutes during business hours, phone calls answered immediately.'
        },
        {
          question: 'Do you offer phone support?',
          answer: 'Yes, our premium members get priority phone support. Standard support includes email and live chat assistance.'
        }
      ]
    }
  ];

  const filteredSections = helpSections.map(section => ({
    ...section,
    content: section.content.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.content.length > 0 || section.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help & FAQ
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Popular Topics */}
          <div>
            <h3 className="font-semibold text-sm text-gray-900 mb-3">Popular Topics</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('payment')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('order')}>
                <FileText className="h-4 w-4 mr-2" />
                Orders
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('account')}>
                <Users className="h-4 w-4 mr-2" />
                Account
              </Button>
              <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('security')}>
                <Shield className="h-4 w-4 mr-2" />
                Security
              </Button>
            </div>
          </div>

          {/* Safety & Security Quick Info */}
          <Accordion type="single" collapsible className="border rounded-lg bg-blue-50/60">
            <AccordionItem value="safety-security">
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <h3 className="font-semibold tracking-tight text-base">Safety & Security</h3>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3 text-sm text-gray-700">
                <p>We prioritise buyer safety. All payments are protected in escrow until you approve the work, and providers undergo verification checks including identity and compliance reviews.</p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>Secure checkout with PCI-compliant processors and optional two-factor authentication for your account.</li>
                  <li>Dedicated trust & safety team monitoring orders for suspicious activity.</li>
                  <li>Full data protection: we encrypt personal information and never share files outside your project workspace.</li>
                </ul>
                <div className="pt-2 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('two-factor')}>
                    Enable 2FA
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('dispute')}>
                    Dispute Guidelines
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={() => setSearchQuery('data protection')}>
                    Data Protection
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          {/* Help Sections */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {filteredSections.map((section) => (
                <Card key={section.id}>
                  <CardHeader className="pb-3">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className="h-4 w-4" />
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </div>
                      {expandedSections.includes(section.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </CardHeader>

                  {expandedSections.includes(section.id) && (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {section.content.map((item, index) => (
                          <div key={index} className="border-l-2 border-blue-200 pl-4">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">
                              {item.question}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Contact Support */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm text-blue-900 mb-1">
                    Still need help?
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Our support team is here to help you succeed.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" className="justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Live Chat
                    </Button>
                    <Button size="sm" variant="outline" className="justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Support
                    </Button>
                    <Button size="sm" variant="outline" className="justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Us
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
