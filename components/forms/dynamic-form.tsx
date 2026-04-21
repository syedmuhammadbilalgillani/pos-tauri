"use client";

import * as React from "react";
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  type Path,
  type RegisterOptions,
  type SubmitHandler,
  type UseFormReturn,
  useForm,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Eye, EyeOff } from "lucide-react";

type FieldDependencyOperator =
  | "equals"
  | "notEquals"
  | "in"
  | "notIn"
  | "truthy"
  | "falsy";

export type DynamicOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type DynamicFieldBase<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  hidden?: boolean;
  className?: string;
  fieldWrapperClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12;
  rules?: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  dependsOn?: {
    field: Path<TFieldValues>;
    operator?: FieldDependencyOperator;
    value?: unknown;
  };
};

type InputField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "input";
    inputType?: React.InputHTMLAttributes<HTMLInputElement>["type"];
    inputProps?: Omit<
      React.ComponentProps<"input">,
      "name" | "type" | "disabled" | "required"
    >;
  };

type SlugField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "slug";
    inputProps?: Omit<
      React.ComponentProps<"input">,
      "name" | "type" | "disabled" | "required"
    >;
  };

type TextareaField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "textarea";
    textareaProps?: Omit<
      React.ComponentProps<"textarea">,
      "name" | "disabled" | "required"
    >;
  };

type SelectField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "select";
    options: DynamicOption[];
    selectProps?: {
      triggerClassName?: string;
      contentClassName?: string;
    };
  };

type RadioField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "radio";
    options: DynamicOption[];
    radioGroupClassName?: string;
  };

type SwitchField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "switch";
  };

type CheckboxField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "checkbox";
  };

type CheckboxGroupField<TFieldValues extends FieldValues> =
  DynamicFieldBase<TFieldValues> & {
    type: "checkbox-group";
    options: DynamicOption[];
    direction?: "row" | "column";
  };

export type DynamicField<TFieldValues extends FieldValues> =
  | InputField<TFieldValues>
  | SlugField<TFieldValues>
  | TextareaField<TFieldValues>
  | SelectField<TFieldValues>
  | RadioField<TFieldValues>
  | SwitchField<TFieldValues>
  | CheckboxField<TFieldValues>
  | CheckboxGroupField<TFieldValues>;

function toStrictSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type DynamicFormSection<TFieldValues extends FieldValues> = {
  id: string;
  title?: string;
  description?: string;
  className?: string;
  fields: DynamicField<TFieldValues>[];
};

export type DynamicFormProps<TFieldValues extends FieldValues> = {
  fields?: DynamicField<TFieldValues>[];
  sections?: DynamicFormSection<TFieldValues>[];
  defaultValues?: DefaultValues<TFieldValues>;
  form?: UseFormReturn<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  transformValues?: (values: TFieldValues) => TFieldValues;
  className?: string;
  formGridClassName?: string;
  submitLabel?: string;
  submitButtonClassName?: string;
  submitButtonVariant?: React.ComponentProps<typeof Button>["variant"];
  submitButtonSize?: React.ComponentProps<typeof Button>["size"];
  hideSubmitButton?: boolean;
  isSubmitting?: boolean;
  footer?: React.ReactNode;
};

function shouldShowField<TFieldValues extends FieldValues>(
  field: DynamicField<TFieldValues>,
  values: TFieldValues,
) {
  if (field.hidden) {
    return false;
  }

  if (!field.dependsOn) {
    return true;
  }

  const sourceValue = values[field.dependsOn.field];
  const operator = field.dependsOn.operator ?? "equals";
  const compareValue = field.dependsOn.value;

  switch (operator) {
    case "notEquals":
      return sourceValue !== compareValue;
    case "in":
      return Array.isArray(compareValue) && compareValue.includes(sourceValue);
    case "notIn":
      return Array.isArray(compareValue) && !compareValue.includes(sourceValue);
    case "truthy":
      return Boolean(sourceValue);
    case "falsy":
      return !sourceValue;
    case "equals":
    default:
      return sourceValue === compareValue;
  }
}

function getGridSpanClass(span?: DynamicFieldBase<FieldValues>["colSpan"]) {
  switch (span) {
    case 1:
      return "md:col-span-1";
    case 2:
      return "md:col-span-2";
    case 3:
      return "md:col-span-3";
    case 4:
      return "md:col-span-4";
    case 5:
      return "md:col-span-5";
    case 6:
      return "md:col-span-6";
    case 12:
      return "md:col-span-12";
    default:
      return "md:col-span-6";
  }
}

function FieldShell({
  id,
  label,
  helperText,
  error,
  required,
  className,
  labelClassName,
  descriptionClassName,
  errorClassName,
  children,
}: {
  id: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  errorClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label
          htmlFor={id}
          className={cn("text-sm font-medium", labelClassName)}
        >
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </Label>
      ) : null}
      {children}
      {helperText ? (
        <p
          className={cn("text-xs text-muted-foreground", descriptionClassName)}
        >
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p className={cn("text-xs text-destructive", errorClassName)}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function DynamicFieldRenderer<TFieldValues extends FieldValues>({
  field,
  form,
}: {
  field: DynamicField<TFieldValues>;
  form: UseFormReturn<TFieldValues>;
}) {
  const fieldError = form.formState.errors[field.name];
  const errorText = fieldError?.message as string | undefined;
  const id = `dynamic-form-${String(field.name)}`;
  const isRequired = Boolean(field.required || field.rules?.required);

  switch (field.type) {
    case "slug":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Controller
            control={form.control}
            name={field.name}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <Input
                id={id}
                type="text"
                placeholder={field.placeholder}
                disabled={field.disabled}
                required={field.required}
                className={field.inputClassName}
                {...field.inputProps}
                value={(controllerField.value as string | undefined) ?? ""}
                onChange={(event) =>
                  controllerField.onChange(toStrictSlug(event.target.value))
                }
                onBlur={controllerField.onBlur}
                name={controllerField.name}
                ref={controllerField.ref}
              />
            )}
          />
        </FieldShell>
      );

    case "textarea":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Textarea
            id={id}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            className={field.inputClassName}
            {...field.textareaProps}
            {...form.register(field.name, field.rules)}
          />
        </FieldShell>
      );

    case "select":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Controller
            control={form.control}
            name={field.name}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <Select
                value={(controllerField.value as string | undefined) ?? ""}
                onValueChange={controllerField.onChange}
                disabled={field.disabled}
              >
                <SelectTrigger
                  id={id}
                  className={cn("w-full", field.selectProps?.triggerClassName)}
                >
                  <SelectValue
                    placeholder={field.placeholder ?? "Select an option"}
                  />
                </SelectTrigger>
                <SelectContent className={field.selectProps?.contentClassName}>
                  {field.options.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>
      );

    case "radio":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Controller
            control={form.control}
            name={field.name}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <RadioGroup
                value={(controllerField.value as string | undefined) ?? ""}
                onValueChange={controllerField.onChange}
                className={cn("gap-3", field.radioGroupClassName)}
              >
                {field.options.map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex items-center gap-2 rounded-md border p-2 text-sm",
                      option.disabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer",
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      disabled={option.disabled || field.disabled}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
        </FieldShell>
      );

    case "switch":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Controller
            control={form.control}
            name={field.name}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <div className="flex items-center gap-3">
                <Switch
                  checked={Boolean(controllerField.value)}
                  onCheckedChange={controllerField.onChange}
                  disabled={field.disabled}
                />
                <span className="text-sm text-muted-foreground">
                  {Boolean(controllerField.value) ? "Enabled" : "Disabled"}
                </span>
              </div>
            )}
          />
        </FieldShell>
      );

    case "checkbox":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Controller
            control={form.control}
            name={field.name}
            rules={field.rules}
            render={({ field: controllerField }) => (
              <input
                id={id}
                type="checkbox"
                checked={Boolean(controllerField.value)}
                onChange={(event) =>
                  controllerField.onChange(event.target.checked)
                }
                disabled={field.disabled}
                className={cn(
                  "h-4 w-4 rounded border border-input text-primary accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  field.inputClassName,
                )}
              />
            )}
          />
        </FieldShell>
      );

    case "checkbox-group":
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          <Controller
            control={form.control}
            name={field.name}
            rules={field.rules}
            render={({ field: controllerField }) => {
              const selectedValues = Array.isArray(controllerField.value)
                ? (controllerField.value as string[])
                : [];
              return (
                <div
                  className={cn(
                    "gap-2",
                    field.direction === "row"
                      ? "flex flex-wrap items-center"
                      : "grid",
                  )}
                >
                  {field.options.map((option) => {
                    const checked = selectedValues.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={cn(
                          "flex items-center gap-2 rounded-md border p-2 text-sm",
                          option.disabled
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={option.disabled || field.disabled}
                          onChange={(event) => {
                            if (event.target.checked) {
                              controllerField.onChange([
                                ...selectedValues,
                                option.value,
                              ]);
                              return;
                            }
                            controllerField.onChange(
                              selectedValues.filter(
                                (item) => item !== option.value,
                              ),
                            );
                          }}
                          className="h-4 w-4 rounded border border-input accent-primary"
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              );
            }}
          />
        </FieldShell>
      );

    case "input":
    default:
      return (
        <FieldShell
          id={id}
          label={field.label}
          helperText={field.helperText}
          error={errorText}
          required={isRequired}
          className={field.fieldWrapperClassName}
          labelClassName={field.labelClassName}
          descriptionClassName={field.descriptionClassName}
          errorClassName={field.errorClassName}
        >
          {field.inputType === "password" ? (
            <PasswordInputWithToggle
              id={id}
              className={field.inputClassName}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              {...field.inputProps}
              {...form.register(field.name, field.rules)}
            />
          ) : (
            <Input
              id={id}
              type={field.inputType ?? "text"}
              placeholder={field.placeholder}
              disabled={field.disabled}
              required={field.required}
              className={field.inputClassName}
              {...field.inputProps}
              {...form.register(field.name, field.rules)}
            />
          )}
        </FieldShell>
      );
  }
}

export function DynamicForm<TFieldValues extends FieldValues>({
  fields = [],
  sections = [],
  defaultValues,
  form: providedForm,
  onSubmit,
  transformValues,
  className,
  formGridClassName,
  submitLabel = "Submit",
  submitButtonClassName,
  submitButtonVariant = "default",
  submitButtonSize = "default",
  hideSubmitButton = false,
  isSubmitting,
  footer,
}: DynamicFormProps<TFieldValues>) {
  const internalForm = useForm<TFieldValues>({ defaultValues });
  const form = providedForm ?? internalForm;
  const currentValues = form.watch();
  const allFields = React.useMemo(
    () =>
      sections.length ? sections.flatMap((section) => section.fields) : fields,
    [fields, sections],
  );

  const handleSubmit: SubmitHandler<TFieldValues> = async (values) => {
    const output = transformValues ? transformValues(values) : values;
    await onSubmit(output);
  };

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className={cn("space-y-6", className)}
    >
      {sections.length ? (
        sections.map((section) => (
          <section
            key={section.id}
            className={cn("space-y-4", section.className)}
          >
            {(section.title || section.description) && (
              <div className="space-y-1">
                {section.title ? (
                  <h3 className="text-base font-semibold">{section.title}</h3>
                ) : null}
                {section.description ? (
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                ) : null}
              </div>
            )}
            <div
              className={cn(
                "grid grid-cols-1 gap-4 md:grid-cols-12",
                formGridClassName,
              )}
            >
              {section.fields
                .filter((field) => shouldShowField(field, currentValues))
                .map((field) => (
                  <div
                    key={field.name}
                    className={cn(
                      getGridSpanClass(field.colSpan),
                      field.className,
                    )}
                  >
                    <DynamicFieldRenderer field={field} form={form} />
                  </div>
                ))}
            </div>
          </section>
        ))
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 md:grid-cols-12",
            formGridClassName,
          )}
        >
          {allFields
            .filter((field) => shouldShowField(field, currentValues))
            .map((field) => (
              <div
                key={field.name}
                className={cn(getGridSpanClass(field.colSpan), field.className)}
              >
                <DynamicFieldRenderer field={field} form={form} />
              </div>
            ))}
        </div>
      )}

      {footer}

      {!hideSubmitButton ? (
        <Button
          type="submit"
          variant={submitButtonVariant}
          size={submitButtonSize}
          disabled={isSubmitting ?? form.formState.isSubmitting}
          className={submitButtonClassName}
        >
          {submitLabel}
        </Button>
      ) : null}
    </form>
  );
}
function PasswordInputWithToggle({
  id,
  className,
  placeholder,
  disabled,
  required,
  ...props
}: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = React.useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
      {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
