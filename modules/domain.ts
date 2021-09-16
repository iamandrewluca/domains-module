import {Module} from "@nuxt/types";
// @ts-ignore
import {createRoutes} from '@nuxt/utils'
import Ignore from './ignore'
// @ts-ignore
import Glob from 'glob'
// @ts-ignore
import pify from 'pify'
import fs from 'fs'
import path from 'path'

const glob = pify(Glob)

const module: Module = async function () {

  this.extendRoutes(async (routes: any[]) => {
    const { routeNameSplitter, trailingSlash } = this.options.router
    const supportedExtensions = ['vue', 'js', ...(this.options.build.additionalExtensions || [])]

    const ignore = new Ignore({
      rootDir: this.options.srcDir,
      ignoreArray: this.options.ignore
    })

    const ext = new RegExp(`\\.(${supportedExtensions.join('|')})$`)

    function globPathWithExtensions (path: string) {
      return `${path}/**/*.{${supportedExtensions.join(',')}}`
    }

    const domains = fs.readdirSync(path.resolve(this.options.rootDir, 'domains'))

    for (const domain of domains) {
      const pagesDir = `domains/${domain}/pages`

      const pages = ignore.filter(await glob(globPathWithExtensions(pagesDir as string), {
        cwd: this.options.srcDir,
        follow: false
      }))

      const files: Record<string, string> = {}

      for (const page of pages) {
        const key = page.replace(ext, '')
        // .vue file takes precedence over other extensions
        if (/\.vue$/.test(page) || !files[key]) {
          files[key] = page.replace(/(['"])/g, '\\$1')
        }
      }

      const newRoutes = createRoutes({
        files: Object.values(files),
        srcDir: this.options.srcDir,
        pagesDir: pagesDir,
        routeNameSplitter,
        supportedExtensions: supportedExtensions,
        trailingSlash
      }).map((r: any) => ({
        ...r,
        path: `/${domain}${r.path}`
      }))

      routes.push(...newRoutes)
    }

    console.log(routes);
  })
}

export default module
