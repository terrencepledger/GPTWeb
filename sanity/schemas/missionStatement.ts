import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'missionStatement',
  title: 'Mission Statement',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string'
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true}
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text'
    })
  ]
})
