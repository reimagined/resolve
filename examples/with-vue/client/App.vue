<template>
  <div>
    <b-navbar type="light" variant="light">
      <b-navbar-toggle target="nav-text-collapse"></b-navbar-toggle>
      <b-collapse id="nav-text-collapse" is-nav>
        <b-navbar-nav>
          <b-nav-text>
            <b-nav-item href="/">
              <b-img :src="staticUrls.resolveLogo" /> ReSolve Vue Example
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
    <b-jumbotron lead="ReSolve Vue Example">
      <p v-highlight="{ word: word, live: live, style: style }" >{{ text }}</p>
      <fieldset style="border: none;">
        <label for="word">Search</label>
        <input
          v-model="word"
          :disabled="!live"
          type="text"
          name="word"
          placeholder="Your word here"
        />
      </fieldset>
    </b-jumbotron>
  </div>
</template>

<script>
import getStaticBasedPath from 'resolve-runtime/es/common/utils/get-static-based-path'
import { highlight } from 'vue-highlighter'

export default {
  directives: {
    highlight
  },
  data: ({ $parent: { rootPath, staticPath } }) => {
    const makeStaticUrl = getStaticBasedPath.bind(null, rootPath, staticPath)
    return {
      text: 'Resolve Vue Example',
      word: 'Vue',
      live: true,
      style: {},
      staticUrls: {
        resolveLogo: makeStaticUrl('resolve-logo.png'),
        fbLogo: makeStaticUrl('fb-logo.png'),
        twitterLogo: makeStaticUrl('twitter-logo.png'),
        githubLogo: makeStaticUrl('github-logo.png')
      }
    }
  }
}
</script>
