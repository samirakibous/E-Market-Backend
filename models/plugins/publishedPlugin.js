export default function publishedPlugin(schema) {
  schema.query.isPublished = function () {
    return this.where({ published: true });
  };
}
