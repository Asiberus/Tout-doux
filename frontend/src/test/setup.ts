// Épingle le fuseau : `event.utils.ts` construit ses dates avec moment sans offset explicite,
// donc leur interprétation dépend du fuseau du processus. La machine de dev est à Paris, le
// runner GitHub en UTC — sans ça, un test peut être vert localement et rouge en CI.
process.env.TZ = 'UTC'
