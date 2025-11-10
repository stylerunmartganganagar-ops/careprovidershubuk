export interface InfoPageSection {
  heading: string;
  paragraphs?: string[];
  listTitle?: string;
  listItems?: string[];
}

export interface InfoPageContent {
  title: string;
  subtitle?: string;
  updated?: string;
  intro?: string;
  sections: InfoPageSection[];
}

export const infoPageContent: Record<string, InfoPageContent> = {
  'regulatory-legal': {
    title: 'Regulatory & Legal Services',
    subtitle: 'Navigate complex health and social care regulations with confidence.',
    updated: 'Updated 10 November 2025',
    intro:
      'Our regulatory and legal specialists help care providers stay compliant, avoid costly enforcement action, and build a culture of accountability across their organisation.',
    sections: [
      {
        heading: 'Tailored compliance support',
        paragraphs: [
          'Whether you are preparing for a CQC inspection, responding to enforcement activity, or seeking ongoing governance advice, we connect you with qualified consultants who understand the nuances of health and social care regulation.',
          'Advisers can review policies, build action plans, and train your teams so regulatory expectations translate into everyday practice.'
        ]
      },
      {
        heading: 'When to engage legal specialists',
        listTitle: 'Common scenarios include:',
        listItems: [
          'Preparing for new service registrations or variations of existing registration conditions.',
          'Responding to warning notices, improvement plans, or safeguarding investigations.',
          'Reviewing contracts, supplier agreements, employment policies, and governance frameworks.',
          'Designing robust quality assurance systems that stand up to regulatory scrutiny.'
        ]
      },
      {
        heading: 'Outcomes you can expect',
        paragraphs: [
          'Work with consultants who take a proactive, not reactive, approach to compliance. Providers experience improved inspection outcomes, reduced enforcement risk, and greater clarity around their responsibilities as registered persons.'
        ]
      }
    ]
  },
  'consulting-services': {
    title: 'Consulting Services',
    subtitle: 'Strategic expertise to strengthen every aspect of your care organisation.',
    updated: 'Updated 10 November 2025',
    intro:
      'CareProvidersHub.co.uk gives you access to senior-level consultants who deliver practical solutions—from operational redesign to digital transformation.'
    ,
    sections: [
      {
        heading: 'Trusted advisors when you need them most',
        paragraphs: [
          'We work with consultants who have led care businesses, managed multi-site portfolios, and delivered turnaround projects across the UK. They understand the pressures that registered managers, directors, and owners face every day.'
        ]
      },
      {
        heading: 'Consultancy areas',
        listTitle: 'Popular assignments include:',
        listItems: [
          'Operational audits and restructuring programmes that improve efficiency and care quality.',
          'Developing business plans, financial models, and growth strategies for new services.',
          'Implementing digital care records, eMAR, workforce planning tools, and analytics platforms.',
          'Embedding risk management frameworks and governance committees that drive accountability.'
        ]
      },
      {
        heading: 'Delivering measurable value',
        paragraphs: [
          'Every engagement is scoped transparently, with clear milestones and success measures. Consultants take a collaborative approach, equipping your team with tools and knowledge so improvements continue long after the project ends.'
        ]
      }
    ]
  },
  'care-management': {
    title: 'Care Management Support',
    subtitle: 'Strengthen leadership, resident experience, and day-to-day operations.',
    updated: 'Updated 10 November 2025',
    intro:
      'Experienced interim managers, clinical leads, and service improvement specialists are ready to stabilise services, mentor your team, and uphold outstanding standards of care.',
    sections: [
      {
        heading: 'Why care management support matters',
        paragraphs: [
          'Care services face intense regulatory scrutiny, workforce shortages, and changing resident needs. Bringing in external expertise can provide breathing space and accelerate improvements without disrupting continuity of care.'
        ]
      },
      {
        heading: 'Key support solutions',
        listTitle: 'Specialists can help you with:',
        listItems: [
          'Interim management assignments for registered managers, clinical leads, and service directors.',
          'Implementing person-centred care models and evidence-based care planning.',
          'Conducting mock inspections, audits, and quality monitoring reviews.',
          'Coaching and mentoring for emerging leaders, safeguarding leads, and governance teams.'
        ]
      },
      {
        heading: 'Building long-term resilience',
        paragraphs: [
          'Engagements focus on building the capability of your permanent team. Consultants provide practical toolkits, shadowing opportunities, and knowledge transfer sessions to ensure improvements are embedded and sustainable.'
        ]
      }
    ]
  },
  'training-development': {
    title: 'Training & Development',
    subtitle: 'Upskill your workforce with accredited, role-specific learning journeys.',
    updated: 'Updated 10 November 2025',
    intro:
      'Access specialist trainers who design engaging programmes aligned to Skills for Care standards, statutory requirements, and your organisation’s culture.',
    sections: [
      {
        heading: 'Flexible delivery formats',
        paragraphs: [
          'Choose from virtual classrooms, face-to-face workshops, blended learning, and on-the-floor coaching. Providers can commission bespoke induction programmes, advanced clinical courses, and leadership pathways.'
        ]
      },
      {
        heading: 'Popular programmes',
        listTitle: 'Topics requested most often include:',
        listItems: [
          'Mandatory training refreshers: moving and handling, infection prevention, medication management, safeguarding.',
          'Advanced clinical skills for nurses and senior carers, including PEG feeding, catheter care, and wound management.',
          'Leadership and management development for registered managers, deputies, and unit leads.',
          'Wellbeing, resilience, and trauma-informed practice to support staff retention.'
        ]
      },
      {
        heading: 'Evidence of impact',
        paragraphs: [
          'Training partners provide detailed attendance records, competency assessments, and recommendations for further development, strengthening the evidence base for inspections and internal assurance.'
        ]
      }
    ]
  },
  'professional-services': {
    title: 'Professional Services',
    subtitle: 'Specialist partners for finance, HR, marketing, IT, and more.',
    updated: 'Updated 10 November 2025',
    intro:
      'Beyond frontline care, thriving organisations rely on reliable professional support. We connect you with vetted partners who understand the unique requirements of health and social care businesses.',
    sections: [
      {
        heading: 'Integrated back-office solutions',
        paragraphs: [
          'From payroll to recruitment, branding to cyber security, our marketplace features professionals who can deliver one-off projects or ongoing managed services tailored to the sector.'
        ]
      },
      {
        heading: 'Expertise available',
        listTitle: 'Engage providers specialising in:',
        listItems: [
          'Finance and accountancy, including funding bids, management accounts, and investor reporting.',
          'Human resources, employee relations, and workforce planning.',
          'Marketing, digital presence, reputation management, and community engagement.',
          'IT infrastructure, cyber security audits, and data protection compliance.'
        ]
      },
      {
        heading: 'A partnership approach',
        paragraphs: [
          'Suppliers collaborate closely with your leadership team to understand strategic priorities, ensuring services align with regulatory expectations and business goals.'
        ]
      }
    ]
  },
  'supplies-equipment': {
    title: 'Supplies & Equipment',
    subtitle: 'Procure reliable products that support safe, dignified care.',
    updated: 'Updated 10 November 2025',
    intro:
      'Source everything from PPE and continence products to specialist beds, assistive technology, and facilities management services—all from trusted suppliers experienced in the care sector.',
    sections: [
      {
        heading: 'Quality assured suppliers',
        paragraphs: [
          'Vetted vendors meet rigorous standards around product quality, delivery performance, and after-sales support. Many offer framework pricing or volume discounts for multi-site operators.'
        ]
      },
      {
        heading: 'What you can source',
        listTitle: 'Popular categories include:',
        listItems: [
          'Clinical consumables, disposables, and infection control solutions.',
          'Furniture, specialist seating, profiling beds, and pressure relief equipment.',
          'Digital monitoring devices, nurse call systems, and environmental sensors.',
          'Catering, laundry, cleaning contracts, and facilities maintenance services.'
        ]
      },
      {
        heading: 'Support beyond procurement',
        paragraphs: [
          'Suppliers can arrange demonstrations, staff training, installation, and servicing schedules, helping you maximise value and ensure equipment remains compliant and safe.'
        ]
      }
    ]
  },
  'how-it-works': {
    title: 'How CareProvidersHub.co.uk Works',
    subtitle: 'Match with trusted professionals in four simple steps.',
    updated: 'Updated 10 November 2025',
    intro:
      'We designed our marketplace to make sourcing care-sector expertise transparent, efficient, and safeguarded.',
    sections: [
      {
        heading: '1. Tell us what you need',
        paragraphs: [
          'Post a project or browse vetted services. Share outcomes, timelines, and any regulatory considerations so providers can respond accurately.'
        ]
      },
      {
        heading: '2. Review proposals and profiles',
        paragraphs: [
          'Assess experience, ratings, sample deliverables, and compliance credentials. Our messaging tools let you clarify scope and confirm fit before committing.'
        ]
      },
      {
        heading: '3. Secure collaboration',
        paragraphs: [
          'Agree milestones, lock in pricing, and manage payments through our safeguarded escrow system. Automated reminders keep everyone on track.'
        ]
      },
      {
        heading: '4. Measure impact',
        paragraphs: [
          'Track progress, capture outcomes, and leave feedback so the community can benefit from your experience. Continuous insights help us improve matching algorithms.'
        ]
      }
    ]
  },
  'find-services': {
    title: 'Find Services',
    subtitle: 'Discover specialists who understand the realities of delivering outstanding care.',
    updated: 'Updated 10 November 2025',
    intro:
      'Search by category, outcome, budget, or accreditation to build your perfect shortlist. Each listing is vetted for quality, safeguarding, and regulatory compliance awareness.',
    sections: [
      {
        heading: 'Smart search filters',
        paragraphs: [
          'Filter by service category, location, budget range, and availability. Use keyword search to surface niche expertise such as dementia training, supported living set-up, or DBS managed services.'
        ]
      },
      {
        heading: 'Transparent information',
        paragraphs: [
          'Profiles include biographies, case studies, verified qualifications, and real feedback from other providers. Spend less time chasing references and more time comparing value.'
        ]
      },
      {
        heading: 'Save and collaborate',
        paragraphs: [
          'Save favourites, share them with colleagues, and invite shortlisted partners to submit proposals. Every interaction stays secure within your dashboard.'
        ]
      }
    ]
  },
  'compare-providers': {
    title: 'Compare Providers',
    subtitle: 'Confidently evaluate proposals side-by-side before you commit.',
    updated: 'Updated 10 November 2025',
    intro:
      'Our comparison tools give you a clear view of pricing, experience, timelines, and compliance commitments so you can make informed decisions quickly.',
    sections: [
      {
        heading: 'Evidence-based decisions',
        paragraphs: [
          'See how providers stack up across ratings, qualifications, and response speed. Download comparison summaries to share with boards, investors, or senior leadership.'
        ]
      },
      {
        heading: 'Focus on value, not just cost',
        paragraphs: [
          'Highlight unique deliverables, innovation, and aftercare support alongside price. This ensures comparisons factor in the qualitative value your organisation needs.'
        ]
      },
      {
        heading: 'Compliance assurance',
        paragraphs: [
          'Providers confirm insurance, DBS status, and relevant registrations through our onboarding checks, reducing due diligence time for your procurement team.'
        ]
      }
    ]
  },
  'success-stories': {
    title: 'Success Stories',
    subtitle: 'Real outcomes from providers and professionals collaborating through CareProvidersHub.co.uk.',
    updated: 'Updated 10 November 2025',
    intro:
      'Learn how organisations across residential care, supported living, home care, and community services have transformed their operations with help from our marketplace.',
    sections: [
      {
        heading: 'Showcasing measurable impact',
        paragraphs: [
          'Case studies highlight inspection improvements, occupancy growth, service launches, and staff retention gains achieved through specialist support.'
        ]
      },
      {
        heading: 'Stories from providers and professionals',
        listTitle: 'Expect to find:',
        listItems: [
          'Before-and-after narratives detailing the challenges faced and solutions implemented.',
          'Quotes from registered managers, owners, and frontline staff about collaboration experiences.',
          'Insights from specialists on best practices that other providers can replicate.'
        ]
      },
      {
        heading: 'Share your success',
        paragraphs: [
          'Completed a project through the hub? Submit your story so we can amplify your achievements and inspire others within the sector.'
        ]
      }
    ]
  },
  'pricing-guide': {
    title: 'Pricing Guide',
    subtitle: 'Understand how to budget for external expertise and essential services.',
    updated: 'Updated 10 November 2025',
    intro:
      'Our pricing guide explains typical cost ranges, factors that influence proposals, and tips for commissioning services cost-effectively without compromising quality.',
    sections: [
      {
        heading: 'What drives project pricing',
        listTitle: 'Key considerations include:',
        listItems: [
          'Scope and complexity of work, including regulatory deadlines or multi-site delivery.',
          'Required seniority or specialist qualifications of the consultant or provider.',
          'Travel, on-site requirements, and ongoing support or maintenance.',
          'Data, technology, or equipment costs associated with the engagement.'
        ]
      },
      {
        heading: 'Budgeting guidance',
        paragraphs: [
          'We provide suggested ranges for common project types and highlight questions to ask providers so you can compare proposals on a like-for-like basis.'
        ]
      },
      {
        heading: 'Value through transparency',
        paragraphs: [
          'Using milestone payments, clear deliverables, and post-engagement reviews helps both parties stay aligned on value delivered.'
        ]
      }
    ]
  },
  'join-as-professional': {
    title: 'Join as a Professional',
    subtitle: 'Showcase your expertise to buyers seeking trusted partners.',
    updated: 'Updated 10 November 2025',
    intro:
      'We welcome consultants, trainers, clinical specialists, technology providers, and suppliers who share our commitment to quality and safeguarding.',
    sections: [
      {
        heading: 'Why join the marketplace',
        listTitle: 'Benefits include:',
        listItems: [
          'Access to a steady pipeline of vetted opportunities across the UK care sector.',
          'Secure contract management, milestone payments, and streamlined invoicing.',
          'Support with showcasing case studies, certifications, and testimonials.'
        ]
      },
      {
        heading: 'How onboarding works',
        paragraphs: [
          'Complete a simple profile, submit compliance documentation, and share evidence of previous work. Our team reviews each submission to maintain a trusted community.'
        ]
      },
      {
        heading: 'Ongoing support',
        paragraphs: [
          'We offer resources on proposal writing, pricing, and delivering exceptional customer experience so your business grows alongside ours.'
        ]
      }
    ]
  },
  'advertise-services': {
    title: 'Advertise Your Services',
    subtitle: 'Reach decision-makers when they are ready to commission support.',
    updated: 'Updated 10 November 2025',
    intro:
      'Premium advertising options increase your visibility across search results, category pages, and curated newsletters.',
    sections: [
      {
        heading: 'Advertising packages',
        listTitle: 'Choose from:',
        listItems: [
          'Featured listings and boosted positions in relevant categories.',
          'Sponsored content, webinars, and downloadable resources.',
          'Targeted email campaigns to buyers based on service category and geography.'
        ]
      },
      {
        heading: 'Measurable performance',
        paragraphs: [
          'Track impressions, clicks, enquiries, and conversions through your provider dashboard, allowing you to refine messaging and spend.'
        ]
      },
      {
        heading: 'Safeguarded brand alignment',
        paragraphs: [
          'All advertising adheres to our quality and safeguarding standards, ensuring buyers can trust promoted providers.'
        ]
      }
    ]
  },
  'provider-resources': {
    title: 'Provider Resources',
    subtitle: 'Toolkits, templates, and guidance to support operational excellence.',
    updated: 'Updated 10 November 2025',
    intro:
      'Explore curated resources created with subject-matter experts, from policy templates to workforce planning calculators.',
    sections: [
      {
        heading: 'Always up to date',
        paragraphs: [
          'Resources are reviewed regularly to reflect regulatory updates, emerging best practice, and sector insights.'
        ]
      },
      {
        heading: 'What you will find',
        listTitle: 'Popular downloads include:',
        listItems: [
          'Mock inspection toolkits and governance dashboards.',
          'Policies aligned to CQC key question areas.',
          'Recruitment, onboarding, and retention frameworks.',
          'Financial planning models to monitor occupancy, staffing, and EBITDA.'
        ]
      },
      {
        heading: 'Community collaboration',
        paragraphs: [
          'Share your own templates or request new resources so we can continue building a supportive knowledge base for the sector.'
        ]
      }
    ]
  },
  'blog-insights': {
    title: 'Blog & Insights',
    subtitle: 'Expert opinion and practical advice for today’s care leaders.',
    updated: 'Updated 10 November 2025',
    intro:
      'Stay informed with articles covering regulation, workforce, innovation, and market trends, written by practitioners who live these challenges every day.',
    sections: [
      {
        heading: 'What to expect',
        listTitle: 'Our editorial calendar includes:',
        listItems: [
          'Deep dives into regulatory changes and what they mean for providers.',
          'Leadership perspectives on culture, retention, and wellbeing.',
          'Technology reviews showcasing solutions that drive measurable outcomes.'
        ]
      },
      {
        heading: 'Get involved',
        paragraphs: [
          'We welcome guest contributors and case study submissions. Share your expertise to support peers and build your profile.'
        ]
      }
    ]
  },
  'cqc-guidance': {
    title: 'CQC Guidance',
    subtitle: 'Practical steps to meet and exceed regulatory expectations.',
    updated: 'Updated 10 November 2025',
    intro:
      'Understand how to align your service with the Care Quality Commission’s single assessment framework, new quality statements, and evidence requirements.',
    sections: [
      {
        heading: 'Framework at a glance',
        paragraphs: [
          'We explain each quality statement, the types of evidence inspectors expect, and how to embed this into your quality assurance cycle.'
        ]
      },
      {
        heading: 'Actionable resources',
        listTitle: 'Downloadable guidance includes:',
        listItems: [
          'Self-assessment templates mapped to key questions and evidence categories.',
          'Resident, relative, and staff engagement tools to capture lived experience.',
          'Risk registers and improvement plans with clear accountability.'
        ]
      }
    ]
  },
  'industry-news': {
    title: 'Industry News',
    subtitle: 'Track the latest developments affecting health and social care providers.',
    updated: 'Updated 10 November 2025',
    intro:
      'We curate national policy updates, funding announcements, case law, and sector research so you stay one step ahead.',
    sections: [
      {
        heading: 'Stay informed',
        paragraphs: [
          'Our editorial team monitors official releases, trade press, and expert commentary. Articles are tagged by topic so you can filter what matters most to your service type.'
        ]
      },
      {
        heading: 'Forward planning',
        paragraphs: [
          'Each update includes a “what this means for providers” summary, along with recommended next steps or resources to explore.'
        ]
      }
    ]
  },
  'help-center': {
    title: 'Help Center',
    subtitle: 'Answers to common questions about using CareProvidersHub.co.uk.',
    updated: 'Updated 10 November 2025',
    intro:
      'Find troubleshooting guides, onboarding checklists, and support contact details so you can get help fast.',
    sections: [
      {
        heading: 'Self-service support',
        listTitle: 'Browse articles covering:',
        listItems: [
          'Creating buyer and provider accounts, updating profiles, and managing notifications.',
          'Posting projects, reviewing proposals, and awarding work.',
          'Escrow payments, invoicing, and dispute resolution processes.'
        ]
      },
      {
        heading: 'Need more help?',
        paragraphs: [
          'Raise a ticket directly from your dashboard or email support@careprovidershub.co.uk. Our team typically responds within one business day.'
        ]
      }
    ]
  },
  'faqs': {
    title: 'Frequently Asked Questions',
    subtitle: 'Quick answers to the most common queries from buyers and providers.',
    updated: 'Updated 10 November 2025',
    intro:
      'Before reaching out to support, review our FAQs for immediate clarity on policies, processes, and platform features.',
    sections: [
      {
        heading: 'General questions',
        listTitle: 'Topics include:',
        listItems: [
          'Eligibility to join the platform and verification requirements.',
          'How ratings and reviews are moderated.',
          'What happens if a project scope changes after award?' 
        ]
      },
      {
        heading: 'Buyer-specific questions',
        listTitle: 'Common concerns:',
        listItems: [
          'How to structure milestones and release payments.',
          'Managing multiple stakeholders within a project workspace.',
          'Steps to take if a provider becomes unavailable mid-project.'
        ]
      },
      {
        heading: 'Provider-specific questions',
        listTitle: 'Guidance includes:',
        listItems: [
          'Submitting compelling proposals and setting expectations early.',
          'Handling cancellations, disputes, or delayed approvals.',
          'How platform fees are calculated and invoiced.'
        ]
      }
    ]
  },
  'about-us': {
    title: 'About CareProvidersHub.co.uk',
    subtitle: 'Connecting care providers with the expertise they need to thrive.',
    updated: 'Updated 10 November 2025',
    intro:
      'We are a UK-based team passionate about improving outcomes for people who draw on care and support. By simplifying access to specialist knowledge, we help providers focus on what matters most: delivering safe, compassionate care.',
    sections: [
      {
        heading: 'Our mission',
        paragraphs: [
          'To build a trusted marketplace that empowers providers of every size to find the right expertise at the right time, whilst upholding the highest standards of safeguarding and professionalism.'
        ]
      },
      {
        heading: 'Our values',
        listTitle: 'We believe in:',
        listItems: [
          'Transparency – clear expectations, fair pricing, and open communication.',
          'Quality – vetting every professional for competence, compliance, and customer service.',
          'Collaboration – supporting partnerships that drive sustainable improvement.'
        ]
      },
      {
        heading: 'The team behind the platform',
        paragraphs: [
          'Our leadership group includes former registered managers, commissioners, technology entrepreneurs, and clinical specialists. We combine practical experience with digital innovation to meet sector needs.'
        ]
      }
    ]
  },
  'contact-us': {
    title: 'Contact Us',
    subtitle: 'We are here to help with platform queries, partnerships, and media requests.',
    updated: 'Updated 10 November 2025',
    intro:
      'Choose the channel that suits you best. We respond to most enquiries within one business day.',
    sections: [
      {
        heading: 'Customer support',
        paragraphs: [
          'Email support@careprovidershub.co.uk for help with accounts, projects, or billing. Include screenshots or reference numbers so we can assist quickly.'
        ]
      },
      {
        heading: 'Partnership enquiries',
        paragraphs: [
          'Interested in collaborating on events, research, or co-branded content? Contact partnerships@careprovidershub.co.uk.'
        ]
      },
      {
        heading: 'Media and press',
        paragraphs: [
          'For interviews, commentary, or press releases, email media@careprovidershub.co.uk. We can provide spokespeople with frontline care and regulatory expertise.'
        ]
      }
    ]
  },
  'careers': {
    title: 'Careers at CareProvidersHub.co.uk',
    subtitle: 'Join a mission-driven team transforming access to care-sector expertise.',
    updated: 'Updated 10 November 2025',
    intro:
      'We recruit talented individuals who share our commitment to improving quality of care. Explore opportunities across product, engineering, customer success, compliance, and marketing.',
    sections: [
      {
        heading: 'What we offer',
        listTitle: 'Team members benefit from:',
        listItems: [
          'Hybrid working arrangements and purposeful collaboration spaces.',
          'Comprehensive wellbeing support, including mental health days and access to counselling.',
          'Professional development budgets and mentoring from sector experts.'
        ]
      },
      {
        heading: 'Our culture',
        paragraphs: [
          'We prioritise inclusion, continuous learning, and transparent communication. Everyone has a voice in shaping the platform and the impact we make.'
        ]
      },
      {
        heading: 'Current openings',
        paragraphs: [
          'View available roles on our careers portal or send a speculative application to careers@careprovidershub.co.uk. We welcome applications from people with lived experience of care.'
        ]
      }
    ]
  },
  'terms-of-service': {
    title: 'Terms of Service',
    subtitle: 'The legal framework for using CareProvidersHub.co.uk.',
    updated: 'Updated 10 November 2025',
    intro:
      'These terms outline the rights and responsibilities of buyers, providers, and CareProvidersHub.co.uk. Please review them carefully before using the platform.',
    sections: [
      {
        heading: '1. Acceptance of terms',
        paragraphs: [
          'By creating an account or using any part of the Services you agree to be bound by these Terms of Service, our Privacy Policy, and Code of Conduct. If you do not agree, you must discontinue using the platform.'
        ]
      },
      {
        heading: '2. Use of the platform',
        listTitle: 'Users must:',
        listItems: [
          'Provide accurate information, maintain account security, and comply with applicable laws.',
          'Use the messaging and payment tools provided. Off-platform payments are prohibited.',
          'Respect intellectual property rights and confidentiality obligations.'
        ]
      },
      {
        heading: '3. Project and service engagements',
        paragraphs: [
          'Buyers and providers agree to honour commitments, deliver work to scope, and use milestone approvals to confirm delivery. Disputes will be mediated by the CareProvidersHub.co.uk support team in line with our dispute resolution process.'
        ]
      },
      {
        heading: '4. Platform fees and payments',
        paragraphs: [
          'We disclose platform fees upfront. Payments are held in escrow until both parties confirm milestones have been met. Fees are non-refundable once work has been accepted.'
        ]
      },
      {
        heading: '5. Limitation of liability',
        paragraphs: [
          'CareProvidersHub.co.uk is not liable for indirect or consequential losses arising from engagements between users. Our liability is limited to the fees paid to us in connection with the relevant transaction.'
        ]
      },
      {
        heading: '6. Changes to these terms',
        paragraphs: [
          'We may update these terms from time to time. Material changes will be communicated via email and through platform notifications. Continued use of the Services constitutes acceptance of the revised terms.'
        ]
      },
      {
        heading: '7. Contact',
        paragraphs: [
          'Questions about these terms can be sent to legal@careprovidershub.co.uk.'
        ]
      }
    ]
  }
};
