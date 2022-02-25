/** Interface that represents the chat config. Can be used for setting custom names
 * for rooms and users collections. Call `setConfig` before doing anything else if
 * you want to change the default collection names. When using custom names don't forget
 * to update your security rules and indexes. */
export interface IFirebaseChatCoreConfig {
  roomsCollectionName: string;
  usersCollectionName: string;
}

export namespace MessageType {
  export type Any = ICustom | IFile | IImage | IText | IUnsupported;
  export type PartialAny =
    | IPartialCustom
    | IPartialFile
    | IPartialImage
    | IPartialText;

  interface IBase {
    author: IUser;
    createdAt?: number;
    id: string;
    metadata?: Record<string, any>;
    roomId?: string;
    status?: 'delivered' | 'error' | 'seen' | 'sending' | 'sent';
    type: 'custom' | 'file' | 'image' | 'text' | 'unsupported';
    updatedAt?: number;
  }

  export interface IPartialCustom extends IBase {
    metadata?: Record<string, any>;
    type: 'custom';
  }

  export interface ICustom extends IBase, IPartialCustom {
    type: 'custom';
  }

  export interface IPartialFile {
    metadata?: Record<string, any>;
    mimeType?: string;
    name: string;
    size: number;
    type: 'file';
    uri: string;
  }

  export interface IFile extends IBase, IPartialFile {
    type: 'file';
  }

  export interface IPartialImage {
    height?: number;
    metadata?: Record<string, any>;
    name: string;
    size: number;
    type: 'image';
    uri: string;
    width?: number;
  }

  export interface IImage extends IBase, IPartialImage {
    type: 'image';
  }

  export interface IPartialText {
    metadata?: Record<string, any>;
    previewData?: IPreviewData;
    text: string;
    type: 'text';
  }

  export interface IText extends IBase, IPartialText {
    type: 'text';
  }

  export interface IUnsupported extends IBase {
    type: 'unsupported';
  }
}

export interface IPreviewData {
  description?: string;
  image?: IPreviewDataImage;
  link?: string;
  title?: string;
}

export interface IPreviewDataImage {
  height: number;
  url: string;
  width: number;
}

export interface IRoom {
  createdAt?: number;
  id: string;
  imageUrl?: string;
  lastMessages?: MessageType.Any[];
  metadata?: Record<string, any>;
  name?: string;
  type: 'channel' | 'direct' | 'group' | 'unsupported';
  updatedAt?: number;
  users: IUser[];
}

export interface IUser {
  createdAt?: number;
  firstName?: string;
  id: string;
  imageUrl?: string;
  lastName?: string;
  lastSeen?: number;
  metadata?: Record<string, any>;
  role?: 'admin' | 'agent' | 'moderator' | 'user';
  updatedAt?: number;
}
