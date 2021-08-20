import Layout from "@theme/Layout";
import React from "react";
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';


const features = [
  {
    title: <>Everything you need in one place</>,
    imageUrl: 'img/everything-you-need-in-one-place.png',
    description: (
      <>
        With reSolve, you don't need to configure build and dev tools, libraries, or frameworks. 
        Your application will be ready-to-go in seconds.
      </>
    ),
  },
  {
    title: <>Full stack scalable modern app</>,
    imageUrl: 'img/full-stack-scalable-modern-app.png',
    description: (
      <>
        With CQRS, Event Sourcing and reSolve, your application will be easier to 
        develop, adapt, maintain and scale. Functional JavaScript 
        code will also be easier to test.
      </>
    ),
  },
  {
    title: <>Never lose your data</>,
    imageUrl: 'img/don-t-lose-your-data.png',
    description: (
      <>
        With Event Sourcing your application will store everything and will remove nothing. 
        You will not have to anticipate future data requirements and needs.
      </>
    ),
  },
];


export default () => {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <header 
        className='hero hero--dark heroBanner'
        style={{ backgroundImage: `url(${useBaseUrl('/img/header-background.svg')})` }}      
      >
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className="headerButtons">
            <div className='buttonWrapper'>
              <Link
                className={'button'}
                to={useBaseUrl('docs')}
              >
                Get Started
              </Link>
            </div>
            <div className='buttonWrapper'>
              <Link
                className={'button'}
                to={'https://github.com/reimagined/resolve/tree/master/examples'}
              >
                See Examples
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main>
        {features && features.length && (
          <section className="features">
            <div className="container padding-vert--xl">
              <div className="row">
                {features.map(({ imageUrl, title, description }, idx) => (
                  <div
                    key={idx}
                    className='col col--4 text--center'
                  >
                    {imageUrl && (
                      <div className="text--center">
                        <img
                          className='featureImage'
                          src={useBaseUrl(imageUrl)}
                          alt={title}
                        />
                      </div>
                    )}
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <div className="section">
          <div className="container">
            <div className="row">
              <div className="col col--6 padding-vert--lg text--center sectionAlt" >
                <h3>Get started in seconds</h3>
                <p>reSolve allows you to focus on code, not build tools. To create a project, you simply called my-app and run the following command:</p>     
                <code className="featureCode">yarn create resolve-app my-app</code>
              </div>
              <div className="col col--6 padding-vert--lg">
                <img
                  src='https://raw.githubusercontent.com/reimagined/resolve/3571365c58b025cf628046a96bab23eca93367fe/website/static/img/create-resolve-app.svg?sanitize=true'
                />    
              </div>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  )
};
      