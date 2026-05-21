import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  const base = new URL(import.meta.env.BASE_URL, context.site!).href.replace(/\/$/, '');

  return rss({
    title: 'Robert Durgin',
    description: 'Software engineering. AI. Side projects.',
    site: `${base}/`,
    items: posts.map(post => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.description,
      link: `${base}/posts/${post.slug}/`,
    })),
    customData: `<language>en-us</language>`,
  });
}
