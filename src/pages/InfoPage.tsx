import { useParams } from 'react-router-dom';
import { InfoPageLayout } from './InfoPageLayout';
import { infoPageContent } from './infoPageContent';
import NotFound from './NotFound';

export const InfoPage = () => {
  const { slug } = useParams<{ slug: keyof typeof infoPageContent }>();

  if (!slug) {
    return <NotFound />;
  }

  const content = infoPageContent[slug];

  if (!content) {
    return <NotFound />;
  }

  return (
    <InfoPageLayout
      title={content.title}
      subtitle={content.subtitle}
      updated={content.updated}
      intro={content.intro}
    >
      {content.sections.map((section, index) => (
        <section key={section.heading ?? index}>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{section.heading}</h2>
          {section.paragraphs?.map((paragraph, paragraphIndex) => (
            <p key={paragraphIndex} className="mb-4">
              {paragraph}
            </p>
          ))}
          {section.listTitle && (
            <p className="font-semibold text-gray-900 mb-2">{section.listTitle}</p>
          )}
          {section.listItems && (
            <ul className="list-disc ml-6 space-y-2">
              {section.listItems.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </InfoPageLayout>
  );
};

export default InfoPage;
