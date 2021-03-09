/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require('react')

const CompLibrary = require('../../core/CompLibrary.js')

const MarkdownBlock = CompLibrary.MarkdownBlock /* Used to read markdown */
const Container = CompLibrary.Container
const GridBlock = CompLibrary.GridBlock

const siteConfig = require(`${process.cwd()}/siteConfig.js`)

function imgUrl(img) {
  return `${siteConfig.baseUrl}img/${img}`
}

function docUrl(doc, language) {
  return `${siteConfig.baseUrl}docs/${language ? `${language}/` : ''}${doc}`
}

function pageUrl(page, language) {
  return siteConfig.baseUrl + (language ? `${language}/` : '') + page
}

class Button extends React.Component {
  render() {
    return (
      <div className="pluginWrapper buttonWrapper">
        <a className="button" href={this.props.href} target={this.props.target}>
          {this.props.children}
        </a>
      </div>
    )
  }
}

Button.defaultProps = {
  target: '_self',
}

const SplashContainer = ({ children }) => (
  <div
    className="homeContainer"
    style={{ backgroundImage: `url(${imgUrl('header-background.svg')})` }}
  >
    <div className="homeSplashFade">
      <div className="wrapper homeWrapper">{children}</div>
    </div>
  </div>
)

const ProjectTitle = () => (
  <h1 className="projectTitle">
    {siteConfig.title}
    <small>{siteConfig.tagline}</small>
  </h1>
)

const PromoSection = (props) => (
  <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
  </div>
)

class HomeSplash extends React.Component {
  render() {
    const language = this.props.language || ''
    return (
      <SplashContainer>
        <div className="inner">
          <ProjectTitle />
          <PromoSection>
            <Button href={docUrl('introduction.html', language)}>
              Get Started
            </Button>
            <Button
              href="https://github.com/reimagined/resolve/tree/master/examples"
              target="_blank"
            >
              See Examples
            </Button>
          </PromoSection>
        </div>
      </SplashContainer>
    )
  }
}

const Block = (props) => (
  <Container
    padding={['bottom', 'top']}
    id={props.id}
    background={props.background}
  >
    <GridBlock align="center" contents={props.children} layout={props.layout} />
  </Container>
)

const Features = (props) => (
  <Block layout="threeColumn" {...props}>
    {[
      {
        content: `With reSolve, you don't need to configure build and dev tools, libraries, or frameworks. Your application will be ready-to-go in seconds.`,
        image: imgUrl('everything-you-need-in-one-place.png'),
        imageAlign: 'top',
        title: 'Everything you need in one place',
      },
      {
        content: `With CQRS, Event Sourcing and reSolve, your application will be easier to develop, adapt, maintain and scale. Functional JavaScript code will also be easier to test.`,
        image: imgUrl('full-stack-scalable-modern-app.png'),
        imageAlign: 'top',
        title: 'Full stack scalable modern app',
      },
      {
        content: `With Event Sourcing your application will store everything and will remove nothing. You will not have to anticipate future data requirements and needs.`,
        image: imgUrl('don-t-lose-your-data.png'),
        imageAlign: 'top',
        title: "Never lose your data",
      },
    ]}
  </Block>
)

const GetStarted = (props) => (
  <Block layout="twoColumn" background="light" {...props}>
    {[
      {
        title: 'Get started in seconds',
        content: `reSolve allows you to focus on code, not build tools. To create a project, you simply called my-app and run the following command:
\`\`\`sh
yarn create resolve-app my-app
\`\`\`
`,
      },
      {
        image:
          'https://raw.githubusercontent.com/reimagined/resolve/3571365c58b025cf628046a96bab23eca93367fe/website/static/img/create-resolve-app.svg?sanitize=true',
        imageAlign: 'bottom',
      },
    ]}
  </Block>
)

const FeatureCallout = () => (
  <div
    className="productShowcaseSection paddingBottom"
    style={{ textAlign: 'center' }}
  >
    <h2>Feature Callout</h2>
    <MarkdownBlock>
      ### These are features of this project: ------- * Feature 1 * Feature 2
      ```js const a = 3 ```
    </MarkdownBlock>
  </div>
)

const LearnHow = () => (
  <Block background="light">
    {[
      {
        content: 'Talk about learning how to use this',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'right',
        title: 'Learn How',
      },
    ]}
  </Block>
)

const TryOut = () => (
  <Block id="try">
    {[
      {
        content: 'Talk about trying this out',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'left',
        title: 'Try it Out',
      },
    ]}
  </Block>
)

const Description = () => (
  <Block background="dark">
    {[
      {
        content: 'This is another description of how this project is useful',
        image: imgUrl('docusaurus.svg'),
        imageAlign: 'right',
        title: 'Description',
      },
    ]}
  </Block>
)

const Showcase = (props) => {
  if ((siteConfig.users || []).length === 0) {
    return null
  }

  const showcase = siteConfig.users
    .filter((user) => user.pinned)
    .map((user) => (
      <a href={user.infoLink} key={user.infoLink}>
        <img src={user.image} alt={user.caption} title={user.caption} />
      </a>
    ))

  return (
    <div className="productShowcaseSection paddingBottom">
      <h2>Who is Using This?</h2>
      <p>This project is used by all these people</p>
      <div className="logos">{showcase}</div>
      <div className="more-users">
        <a className="button" href={pageUrl('users.html', props.language)}>
          More {siteConfig.title} Users
        </a>
      </div>
    </div>
  )
}

const Index = ({ language = '' }) => (
  <div>
    <HomeSplash language={language} />
    <div className="mainContainer">
      <Features />
      <GetStarted />
      {/*       <FeatureCallout />
      <LearnHow />
      <TryOut />
      <Description />
      <Showcase language={language} /> */}
    </div>
  </div>
)

module.exports = Index
