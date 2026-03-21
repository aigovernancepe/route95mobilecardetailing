import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    author: z.string().default('Route95 Mobile Car Detailing'),
    faqs: z.array(z.object({
      question: z.string(),
      answer: z.string(),
    })).optional(),
  }),
});

export const collections = { blog };
