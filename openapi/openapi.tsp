import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;
using TypeSpec.OpenAPI;
@server(
  "{url}/api",
  "Gitdrive Server URL",
  {
    url: string,
  }
)
@service({
  title: "Gitdrive",
})
namespace Gitdrive;

alias ApiAuth = BearerAuth | ApiKeyAuth<ApiKeyLocation.cookie, "drive.access_token">;

@doc("File streaming response")
model FileStream {
  @doc("The file content as binary data")
  @body
  content: bytes;

  @statusCode
  statusCode: 200 | 206;

  @header("Accept-Ranges")
  @doc("Indicates server supports range requests")
  @example("bytes")
  acceptRanges: "bytes";

  @header("Content-Type")
  @doc("The MIME type of the file")
  @example("application/octet-stream")
  contentType: string;

  @header("Content-Length")
  @doc("Size of the response body in bytes")
  @example("1048576")
  contentLength: string;

  @header("Content-Disposition")
  @doc("File attachment information")
  @example("attachment; filename=\"example.pdf\"")
  contentDisposition: string;

  @header("Content-Range")
  @doc("Range of bytes being sent")
  @example("bytes 0-1048575/2097152")
  contentRange?: string;

  @header("Etag")
  @doc("Entity tag for cache validation")
  @example("5e8d1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b")
  eTag: string;

  @header("Last-Modified")
  @doc("Last modification timestamp")
  lastModified: utcDateTime;
}

@error
@doc("Standard error response")
model Error {
  @doc("Error code")
  @example(500)
  code: integer;

  @doc("Error message")
  @example("Internal server error occurred")
  message: string;
}

@doc("User session information containing authentication and profile details")
model Session {
  user: {
    name: string;
    image: string;
  };
  expires: string;
}

@route("/auth")
@tag("Auth")
interface Auth {
  @route("/session")
  @summary("Get session information")
  @get
  session(@cookie(#{ name: "drive.access_token" }) accessToken?: string): (Session & {
    @header("Set-Cookie") setCookie: string;
  }) | NoContentResponse | Error;

  @route("/login")
  @summary("Login")
  @get
  login(
    @query redirect?: string,
  ): (Session & {
    @header("Set-Cookie") setCookie: string;
  }) | {
    ...Response<307>;

    @header({
      name: "Set-Cookie",
      format: "multi",
    })
    setCookie: string[];

    @header("Location") location: string;
  } | Error;

  @route("/callback")
  @summary("Oauth Callback")
  @get
  callback(
    @query code: string,
    @query state: string,
    @cookie(#{ name: "drive.redirect" }) redirect?: string,
    @cookie(#{ name: "drive.state" }) authState?: string,
  ): {
    ...Response<307>;

    @header({
      name: "Set-Cookie",
      format: "multi",
    })
    setCookie: string[];

    @header("Location") location: string;
  } | Error;

  @route("/logout")
  @summary("Logout")
  @useAuth(ApiAuth)
  @post
  logout(): {
    ...NoContentResponse;
    @header("Set-Cookie") setCookie: string;
  } | Error;
}

@doc("Supported file categories")
enum Category {
  @doc("Archive files (.zip, .rar, etc)")
  archive,

  @doc("Audio files (.mp3, .wav, etc)")
  audio,

  @doc("Document files (.pdf, .doc, etc)")
  document,

  @doc("Image files (.jpg, .png, etc)")
  image,

  @doc("Other file types")
  other,

  @doc("Video files (.mp4, .mov, etc)")
  video,
}

@doc("File query parameters")
model FileQuery {
  @query
  @doc("File name filter")
  @example("video.mp4")
  name?: string;

  @query
  @doc("Search query")
  @example("report 2023")
  query?: string;

  @query
  @doc("Search type")
  @example("text")
  searchType?: "text" | "regex" = "text";

  @query
  @doc("File type")
  @example("file")
  type?: "folder" | "file";

  @query
  @doc("File path")
  @example("/documents/2023/")
  path?: string;

  @query
  @doc("Operation")
  @example("list")
  operation?: "list" | "find" = "list";

  @query
  @doc("File Status")
  @example("active")
  status?: "active" | "pending_deletion" = "active";

  @query
  @doc("Enable deep search")
  @example(false)
  deepSearch?: boolean = false;

  @query
  @doc("Parent folder ID")
  @example("123e4567-e89b-12d3-a456-426614174000")
  parentId?: string;

  @query
  @doc("File category")
  @example(#[Category.document, Category.video])
  category?: Array<Category>;

  @query
  @doc("UpdatedAt Filter supports operator eq, gt, lt, gte, lte")
  updatedAt?: string;

  @query
  @doc("Sort field")
  @example("name")
  sort?: "name" | "updatedAt" | "size" | "id" = "name";

  @query
  @doc("Sort order")
  @example("asc")
  order?: "asc" | "desc" = "asc";

  @query
  @doc("Items per page")
  @example(50)
  @maxValue(1000)
  @minValue(1)
  limit?: integer = 500;

  @query
  @doc("Page number")
  @example(1)
  @minValue(1)
  page?: integer = 1;
}

@doc("File part information")
model Part {
  @doc("Part ID")
  @example(1)
  id: int64;

  name: string;
  size: int64;

  @doc("Encryption salt")
  @example("abc123")
  salt?: string;
}
@doc("File metadata")
model File {
  @doc("File ID")
  @example("123e4567-e89b-12d3-a456-426614174000")
  @visibility(Lifecycle.Read)
  id?: string;

  @doc("File name")
  @example("document.pdf")
  name: string;

  @doc("File type")
  @example("file")
  type: "folder" | "file";

  @doc("File parts")
  parts?: Part[];

  @doc("MIME type")
  @example("application/pdf")
  mimeType?: string;

  @doc("File category")
  @example(Category.document)
  @visibility(Lifecycle.Read)
  category?: Category;

  @doc("Releasel ID")
  @example(123456789)
  releaselId?: int64;

  tag?: string;
  repo?: string;

  @doc("File or Folder path")
  @example("/documents/2023/")
  path?: string;

  @doc("Parent folder ID")
  @example("123e4567-e89b-12d3-a456-426614174000")
  parentId?: string;

  @doc("File size in bytes")
  @example(1048576)
  size?: int64;

  @doc("Encryption status")
  @example(false)
  encrypted?: boolean;

  @doc("Last update time")
  @visibility(Lifecycle.Read)
  updatedAt?: utcDateTime;
}

@doc("Pagination metadata containing count, page information")
model Meta {
  @doc("Total number of items matching the query")
  @example(1250)
  @minValue(0)
  count: integer;

  @doc("Total number of available pages based on limit")
  @example(25)
  @minValue(1)
  totalPages: integer;

  @doc("Current page number in the pagination")
  @example(1)
  @minValue(1)
  currentPage: integer;
}

@doc("Paginated file listing response with metadata")
model FileList {
  @doc("Array of file entries in the current page")
  @minItems(0)
  @maxItems(1000)
  items: File[];

  @doc("Pagination metadata and total count information")
  meta: Meta;
}

@doc("File update request")
model FileUpdate {
  @doc("File name")
  @example("document.pdf")
  name?: string;

  @doc("File parts")
  parts?: Part[];

  @doc("File size in bytes")
  @example(1048576)
  size?: int64;

  @doc("Last update time")
  updatedAt?: utcDateTime;
}

@doc("File parts update request")
model FilePartsUpdate {
  @doc("File name")
  @example("document.pdf")
  name?: string;

  @doc("Parent folder ID")
  @example("123e4567-e89b-12d3-a456-426614174000")
  parentId?: string;

  @doc("Release Id")
  @example(123456)
  releaselId?: int64;

  @doc("Upload ID")
  uploadId?: string;

  @doc("File parts")
  parts?: Part[];

  @doc("File size in bytes")
  @example(1048576)
  size: int64;

  @doc("Last update time")
  updatedAt: utcDateTime;
}

@doc("Move multiple files by ids or path")
@example(#{
  ids: #["123e4567-e89b-12d3-a456-426614174000"],
  destination: "/Documents/2023/",
})
model FileMove {
  @doc("Array of file or folders ids to be moved")
  @minItems(1)
  ids: string[];

  @doc("Destination path where files will be moved to")
  destination: string;
}

@doc("Delete operation request")
@example(#{ ids: #["123e4567-e89b-12d3-a456-426614174000"] })
model FileDelete {
  @doc("Array of file or folders ids to be deleted")
  @minItems(1)
  ids: string[];
}

@doc("Request to create directories")
@example(#{ path: "/Documents/2023/" })
model FileMkDir {
  @doc("Directory path to be created")
  path: string;
}

@doc("Statistics for files by category")
@example(#{
  totalFiles: 1250,
  totalSize: 104857600,
  category: Category.document,
})
model CategoryStats {
  @doc("Total number of files")
  totalFiles: int64;

  @doc("Total size of files in bytes")
  totalSize: int64;

  @doc("Category name")
  category: Category;
}

model ReleaseAsset {
  @doc("Part ID")
  @example(1)
  id: int64;

  name: string;
}

@route("/files")
@tag("Files")
@useAuth(ApiAuth)
interface Files {
  @route("")
  @get
  @summary("List all files")
  list(...FileQuery): FileList | Error;

  @route("")
  @post
  @summary("Create a new file")
  create(...File): {
    ...File;
    @statusCode _: 201;
  } | Error;

  @route("/{id}")
  @get
  @summary("Get file by ID")
  getById(@path id: string): File | Error;

  @route("/{id}")
  @patch
  @summary("Update file")
  update(
    @path id: string,
    @body body: FileUpdate,
    @query skiputs?: "0" | "1" = "0",
  ): File | Error;

  @route("/{id}/parts")
  @put
  @summary("Update file parts")
  updateParts(
    @path id: string,
    @body body: FilePartsUpdate,
  ): NoContentResponse | Error;

  @route("/{id}/{name}")
  @get
  @summary("Stream or Download file")
  stream(
    @path id: string,
    @path name: string,
    @query download?: "0" | "1" = "0",
    @header("Range") range?: string,
  ): FileStream | Error;

  @route("/delete")
  @post
  @summary("Delete files")
  delete(@body body: FileDelete): NoContentResponse | Error;

  @route("/move")
  @post
  @summary("Move files")
  move(@body body: FileMove): NoContentResponse | Error;

  @route("/mkdir")
  @post
  @summary("Create Folders")
  mkdir(@body body: FileMkDir): NoContentResponse | Error;

  @route("/categories")
  @get
  @summary("Get category stats")
  categoryStats(): CategoryStats[] | Error;

  @route("/assets/{id}")
  @get
  @summary("Get Release Assets Ids")
  releaseAssets(@path id: string): ReleaseAsset[] | Error;
}

@doc("Details of an uploaded part")
model UploadPart {
  @doc("Name identifier of the part")
  name: string;

  @doc("Part ID")
  id: int64;

  @doc("Sequential number of the part")
  partNo: integer;

  @doc("Release Id")
  releaseId: int64;

  @doc("Size of the part in bytes")
  size: int64;

  @doc("Indicates if the part is encrypted")
  encrypted: boolean;

  @doc("Salt value used for encryption, required if encrypted is true")
  salt?: string;

  repo: string;
}

@doc("Statistics about the upload")
model UploadStats {
  @doc("Date and time when the upload occurred")
  uploadDate: utcDateTime;

  @doc("Total number of bytes uploaded")
  totalUploaded: int64;
}

model UploadToken {
  url: string;
  token: string;
}

@route("/uploads")
@tag("Uploads")
@useAuth(ApiAuth)
interface Uploads {
  @route("/{id}")
  @post
  @summary("Add file Part")
  add(@path id: string, @body part: UploadPart): NoContentResponse | Error;

  @route("/{id}")
  @get
  @summary("Get uploaded parts by ID")
  byId(@path id: string): UploadPart[] | Error;

  @route("/{id}")
  @delete
  @summary("Delete uploaded file")
  delete(@path id: string): NoContentResponse | Error;

  @route("/stats")
  @get
  @summary("Get upload stats")
  stats(@query days: integer): UploadStats[] | Error;

  @route("/url")
  @get
  @summary("Get Upload Url")
  uploadUrl(): UploadToken | Error;
}

model Release {
  id: int64;
  tag: string;
  repo: string;
}

model Onboard {
  userName: string;
  token: string;
}
@route("/releases")
@tag("Releases")
@useAuth(ApiAuth)
interface Releases {
  @route("")
  @get
  @summary("Get releases")
  list(): Release[] | Error;

  @route("/onboard")
  @post
  @summary("OnBoard User")
  onboard(@body body: Onboard): NoContentResponse | Error;
}

model ApiVersion {
  @doc("API version")
  @example("1.0.0")
  version: string;

  @doc("Git commit SHA")
  @example("a1b2c3d4e5f6g7h8i9j0")
  commitSHA: string;

  @doc("Operating system")
  @example("linux")
  os: string;

  @doc("Architecture")
  @example("amd64")
  arch: string;
}

@route("/version")
interface Version {
  @route("")
  @get
  @summary("Get API version")
  version(): ApiVersion | Error;
}
