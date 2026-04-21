"use client"

import * as React from "react"

import {
  DynamicForm,
  type DynamicField,
  type DynamicFormSection,
  type DynamicOption,
} from "@/components/forms/dynamic-form"

/** Re-export for schema-driven admin UIs; this file remains the interactive field-type catalog. */
export { DynamicForm, type DynamicField, type DynamicFormSection, type DynamicOption }

type DemoFormValues = {
  firstName: string
  lastName: string
  email: string
  password: string
  age: number
  phone: string
  website: string
  search: string
  birthDate: string
  availableTime: string
  meetingAt: string
  billingMonth: string
  planningWeek: string
  favoriteColor: string
  profileScore: number
  avatar: string
  bio: string
  role: string
  gender: string
  notificationsEnabled: boolean
  termsAccepted: boolean
  skills: string[]
  companyName: string
  taxNumber: string
}

const accountFields: DynamicField<DemoFormValues>[] = [
  {
    type: "input",
    name: "firstName",
    label: "First Name",
    placeholder: "John",
    required: true,
    rules: { required: "First name is required" },
    colSpan: 6,
  },
  {
    type: "input",
    name: "lastName",
    label: "Last Name",
    placeholder: "Doe",
    required: true,
    rules: { required: "Last name is required" },
    colSpan: 6,
  },
  {
    type: "input",
    name: "email",
    label: "Email",
    placeholder: "john@company.com",
    inputType: "email",
    required: true,
    rules: {
      required: "Email is required",
      pattern: { value: /\S+@\S+\.\S+/, message: "Enter a valid email address" },
    },
    colSpan: 6,
  },
  {
    type: "input",
    name: "password",
    label: "Password",
    inputType: "password",
    placeholder: "••••••••",
    rules: { minLength: { value: 8, message: "Minimum 8 characters" } },
    colSpan: 6,
  },
  {
    type: "input",
    name: "age",
    label: "Age",
    inputType: "number",
    inputProps: { min: 0, step: 1 },
    rules: { valueAsNumber: true, min: { value: 0, message: "Age must be 0+" } },
    colSpan: 3,
  },
  {
    type: "input",
    name: "phone",
    label: "Phone",
    inputType: "tel",
    placeholder: "+1 555 0000",
    colSpan: 3,
  },
  {
    type: "input",
    name: "website",
    label: "Website",
    inputType: "url",
    placeholder: "https://example.com",
    colSpan: 3,
  },
  {
    type: "input",
    name: "search",
    label: "Search Keyword",
    inputType: "search",
    placeholder: "Type to search...",
    colSpan: 3,
  },
]

const pickerFields: DynamicField<DemoFormValues>[] = [
  { type: "input", name: "birthDate", label: "Birth Date", inputType: "date", colSpan: 3 },
  { type: "input", name: "availableTime", label: "Available Time", inputType: "time", colSpan: 3 },
  {
    type: "input",
    name: "meetingAt",
    label: "Meeting Date & Time",
    inputType: "datetime-local",
    colSpan: 3,
  },
  { type: "input", name: "billingMonth", label: "Billing Month", inputType: "month", colSpan: 3 },
  { type: "input", name: "planningWeek", label: "Planning Week", inputType: "week", colSpan: 3 },
  { type: "input", name: "favoriteColor", label: "Favorite Color", inputType: "color", colSpan: 3 },
  {
    type: "input",
    name: "profileScore",
    label: "Profile Score (Range)",
    inputType: "range",
    inputProps: { min: 0, max: 100, step: 1 },
    rules: { valueAsNumber: true },
    helperText: "Range input type: 0 to 100",
    colSpan: 6,
  },
  {
    type: "input",
    name: "avatar",
    label: "Avatar (File Path Demo)",
    inputType: "file",
    helperText: "This demonstrates file input in schema. Handle files in submit mapping.",
    colSpan: 6,
  },
]

const profileFields: DynamicField<DemoFormValues>[] = [
  {
    type: "textarea",
    name: "bio",
    label: "Bio",
    placeholder: "Tell us about yourself",
    colSpan: 12,
  },
  {
    type: "select",
    name: "role",
    label: "Role",
    placeholder: "Select role",
    options: [
      { label: "Admin", value: "admin" },
      { label: "Manager", value: "manager" },
      { label: "Viewer", value: "viewer" },
    ],
    required: true,
    rules: { required: "Role is required" },
    colSpan: 4,
  },
  {
    type: "radio",
    name: "gender",
    label: "Gender",
    options: [
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
      { label: "Other", value: "other" },
    ],
    colSpan: 4,
  },
  {
    type: "switch",
    name: "notificationsEnabled",
    label: "Notifications",
    helperText: "Enable email and push notifications",
    colSpan: 4,
  },
  {
    type: "checkbox",
    name: "termsAccepted",
    label: "I accept terms and conditions",
    rules: {
      validate: (value) => value === true || "You must accept terms to continue",
    },
    colSpan: 6,
  },
  {
    type: "checkbox-group",
    name: "skills",
    label: "Skills",
    direction: "row",
    options: [
      { label: "React", value: "react" },
      { label: "Next.js", value: "nextjs" },
      { label: "Node.js", value: "nodejs" },
      { label: "Design Systems", value: "design" },
    ],
    colSpan: 6,
  },
  {
    type: "input",
    name: "companyName",
    label: "Company Name",
    placeholder: "Acme Inc.",
    dependsOn: {
      field: "role",
      operator: "in",
      value: ["admin", "manager"],
    },
    colSpan: 6,
  },
  {
    type: "input",
    name: "taxNumber",
    label: "Tax Number",
    placeholder: "TX-123456",
    dependsOn: {
      field: "companyName",
      operator: "truthy",
    },
    colSpan: 6,
  },
]

const formSections: DynamicFormSection<DemoFormValues>[] = [
  {
    id: "account",
    title: "Account Information",
    description: "Common text-style input types",
    fields: accountFields,
  },
  {
    id: "picker",
    title: "Picker Inputs",
    description: "Date/time/color/range/file style inputs",
    fields: pickerFields,
  },
  {
    id: "profile",
    title: "Profile & Preferences",
    description: "Selection controls, conditions, and group fields",
    fields: profileFields,
  },
]

export default function FormBuilder() {
  const [payloadPreview, setPayloadPreview] = React.useState<string>("")

  return (
    <main className="min-h-screen bg-muted/30 p-6 md:p-10">
      <section className="mx-auto w-full max-w-5xl space-y-6 rounded-xl border bg-background p-4 md:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Dynamic Reusable Form Builder</h1>
          <p className="text-sm text-muted-foreground">
            Schema-driven form for design mapping and data-structure mapping with React Hook Form +
            shadcn components.
          </p>
        </div>

        <DynamicForm<DemoFormValues>
          sections={formSections}
          defaultValues={{
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            age: 18,
            phone: "",
            website: "",
            search: "",
            birthDate: "",
            availableTime: "",
            meetingAt: "",
            billingMonth: "",
            planningWeek: "",
            favoriteColor: "#3b82f6",
            profileScore: 50,
            avatar: "",
            bio: "",
            role: "",
            gender: "",
            notificationsEnabled: true,
            termsAccepted: false,
            skills: [],
            companyName: "",
            taxNumber: "",
          }}
          submitLabel="Save Form"
          transformValues={(values) => ({
            ...values,
            email: values.email.trim().toLowerCase(),
            website: values.website.trim(),
          })}
          onSubmit={async (values) => {
            setPayloadPreview(JSON.stringify(values, null, 2))
          }}
        />

        <div className="space-y-2">
          <h2 className="text-sm font-medium">Payload Preview</h2>
          <pre className="overflow-auto rounded-md border bg-muted p-3 text-xs">{payloadPreview}</pre>
        </div>
      </section>
    </main>
  )
}
