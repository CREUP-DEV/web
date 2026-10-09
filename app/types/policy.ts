export interface PolicyDocumentFile {
  name: string | null
  url: string | null
}

export interface PolicyDocument {
  order: number
  name: string
  date: string
  assembly: string | null
  file: PolicyDocumentFile | null
}

export interface PolicyDocumentsResponse {
  data: PolicyDocument[]
  meta: {
    generatedAt?: string | null
    total: number
  }
}
