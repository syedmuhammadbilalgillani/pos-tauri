export enum Permission {
  // User Module
  READ_USER = "read:user",
  WRITE_USER = "write:user",
  EDIT_USER = "edit:user",
  UPDATE_USER = "update:user",
  DELETE_USER = "delete:user",

  // Category Module
  READ_CATEGORY = "read:category",
  WRITE_CATEGORY = "write:category",
  EDIT_CATEGORY = "edit:category",
  UPDATE_CATEGORY = "update:category",
  DELETE_CATEGORY = "delete:category",
  // Specialization Module
  READ_SPECIALIZATION = "read:specialization",
  WRITE_SPECIALIZATION = "write:specialization",
  EDIT_SPECIALIZATION = "edit:specialization",
  UPDATE_SPECIALIZATION = "update:specialization",
  DELETE_SPECIALIZATION = "delete:specialization",

  // Author Module
  READ_AUTHOR = "read:author",
  WRITE_AUTHOR = "write:author",
  EDIT_AUTHOR = "edit:author",
  UPDATE_AUTHOR = "update:author",
  DELETE_AUTHOR = "delete:author",

  // News Module
  READ_NEWS = "read:news",
  WRITE_NEWS = "write:news",
  EDIT_NEWS = "edit:news",
  UPDATE_NEWS = "update:news",
  DELETE_NEWS = "delete:news",

  // Media Module
  READ_MEDIA = "read:media",
  WRITE_MEDIA = "write:media",
  EDIT_MEDIA = "edit:media",
  UPDATE_MEDIA = "update:media",
  DELETE_MEDIA = "delete:media",

  // Magazine Module
  READ_MAGAZINE = "read:magazine",
  WRITE_MAGAZINE = "write:magazine",
  EDIT_MAGAZINE = "edit:magazine",
  UPDATE_MAGAZINE = "update:magazine",
  DELETE_MAGAZINE = "delete:magazine",
}
export const AdminPermission: Permission[] = [
  // User Module
  Permission.READ_USER,
  Permission.WRITE_USER,
  Permission.EDIT_USER,
  Permission.UPDATE_USER,
  Permission.DELETE_USER,

  // Category Module
  Permission.READ_CATEGORY,
  Permission.WRITE_CATEGORY,
  Permission.EDIT_CATEGORY,
  Permission.UPDATE_CATEGORY,
  Permission.DELETE_CATEGORY,

  // Specialization Module
  Permission.READ_SPECIALIZATION,
  Permission.WRITE_SPECIALIZATION,
  Permission.EDIT_SPECIALIZATION,
  Permission.UPDATE_SPECIALIZATION,
  Permission.DELETE_SPECIALIZATION,

  // Author Module
  Permission.READ_AUTHOR,
  Permission.WRITE_AUTHOR,
  Permission.EDIT_AUTHOR,
  Permission.UPDATE_AUTHOR,
  Permission.DELETE_AUTHOR,

  // News Module
  Permission.READ_NEWS,
  Permission.WRITE_NEWS,
  Permission.EDIT_NEWS,
  Permission.UPDATE_NEWS,
  Permission.DELETE_NEWS,

  // Media Module
  Permission.READ_MEDIA,
  Permission.WRITE_MEDIA,
  Permission.EDIT_MEDIA,
  Permission.UPDATE_MEDIA,
  Permission.DELETE_MEDIA,

  // Magazine Module
  Permission.READ_MAGAZINE,
  Permission.WRITE_MAGAZINE,
  Permission.EDIT_MAGAZINE,
  Permission.UPDATE_MAGAZINE,
  Permission.DELETE_MAGAZINE,
];

export const EditorPermission: Permission[] = [
  // User Module
  Permission.READ_USER,
  Permission.WRITE_USER,
  Permission.UPDATE_USER,

  // Category Module
  Permission.READ_CATEGORY,
  Permission.WRITE_CATEGORY,
  Permission.UPDATE_CATEGORY,

  // Specialization Module
  Permission.READ_SPECIALIZATION,
  Permission.WRITE_SPECIALIZATION,
  Permission.EDIT_SPECIALIZATION,
  Permission.UPDATE_SPECIALIZATION,

  // Author Module
  Permission.READ_AUTHOR,
  Permission.WRITE_AUTHOR,
  Permission.UPDATE_AUTHOR,

  // News Module
  Permission.READ_NEWS,
  Permission.WRITE_NEWS,
  Permission.UPDATE_NEWS,

  // Media Module
  Permission.READ_MEDIA,
  Permission.WRITE_MEDIA,
  Permission.UPDATE_MEDIA,

  // Magazine Module
  Permission.READ_MAGAZINE,
  Permission.WRITE_MAGAZINE,
  Permission.UPDATE_MAGAZINE,
];
