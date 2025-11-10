export default function softDeletePlugin(schema) {
  // Instance method: soft delete
  schema.methods.softDelete = function () {
    this.deletedAt = new Date();
    return this.save();
  };

  // Instance method: restore
  schema.methods.restore = function () {
    this.deletedAt = null;
    return this.save();
  };

  // Instance method: check if deleted
  schema.methods.isDeleted = function () {
    return this.deletedAt !== null;
  };

  // Query helper: only get non-deleted documents
  schema.query.notDeleted = function () {
    return this.where({ deletedAt: null });
  };

  // Query helper: only get deleted documents
  schema.query.deleted = function () {
    return this.where({ deletedAt: { $ne: null } });
  };
}
