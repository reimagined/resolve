<template>
  <div>
    <b-navbar type="light" variant="light">
      <b-navbar-toggle target="nav-text-collapse"></b-navbar-toggle>
      <b-collapse id="nav-text-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-text>
            <b-nav-item href="/">
              <b-img :src="staticUrls.resolveLogo" /> {{ text }}
            </b-nav-item>
          </b-nav-text>
          <b-nav-text>
            <b-nav-item href="https://facebook.com/resolvejs/">
              <b-img :src="staticUrls.fbLogo" />
            </b-nav-item>
          </b-nav-text>
          <b-nav-text>
            <b-nav-item href="https://twitter.com/resolvejs">
              <b-img :src="staticUrls.twitterLogo" />
            </b-nav-item>
          </b-nav-text>
          <b-nav-text>
            <b-nav-item href="https://github.com/reimagined/resolve">
              <b-img :src="staticUrls.githubLogo" />
            </b-nav-item>
          </b-nav-text>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
export default {
  data: ({ $parent: { client } }) => {
    return {
      text: 'Resolve Vue Example',
      staticUrls: {
        resolveLogo: client.getStaticAssetUrl('/resolve-logo.png'),
        fbLogo: client.getStaticAssetUrl('/fb-logo.png'),
        twitterLogo: client.getStaticAssetUrl('/twitter-logo.png'),
        githubLogo: client.getStaticAssetUrl('/github-logo.png')
      }
    }
  }
}
</script>
