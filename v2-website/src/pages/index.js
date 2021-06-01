import Layout from "@theme/Layout";
import React from "react";
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useBaseUrl from '@docusaurus/useBaseUrl';

function imgUrl(img) {
  return useBaseUrl(`/img/${img}`)
}

function docUrl(doc) {
  return useBaseUrl(`/docs/${doc}`)
}

function pageUrl(page) {
  return useBaseUrl(`/${page}`)
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

const ProjectTitle = () => {
  const { siteConfig } = useDocusaurusContext()
  return(
    <div className="container">
    <h1 className="hero__title">{siteConfig.title}</h1>    
    <p className="hero__subtitle">{siteConfig.tagline}</p>    
    </div>
  )
}

const PromoSection = (props) => {
  const { siteConfig } = useDocusaurusContext()
  return(
    <div className="section promoSection">
    <div className="promoRow">
      <div className="pluginRowBlock">{props.children}</div>
    </div>
    </div>
  )
}

const HomeSplash = () => {
  return (
    <SplashContainer>
      <div className="inner">
        <ProjectTitle />
        <PromoSection>
          <Button href={docUrl('introduction')}>
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


export default () => {
  const context = useDocusaurusContext()
  const { siteConfig = {} } = context
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomeSplash />
    </Layout>
  )
};
      