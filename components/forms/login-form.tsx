// components/forms/login-form.tsx
"use client";

import {
  DynamicForm,
  type DynamicField,
} from "@/components/forms/form-builder";
import { useLoginMutation } from "@/lib/tan-stack/auth";
import { LoginInput } from "@/lib/validations/auth";
import { LocationData } from "@/types";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { LocationSelectModal } from "../location-select-modal";
import { setActiveLocationId } from "@/lib/tan-stack/auth/storage";

type LoginFormValues = LoginInput;

const loginFields: DynamicField<LoginFormValues>[] = [
  {
    type: "input",
    name: "email",
    label: "Email Address",
    placeholder: "Enter your email",
    inputType: "email",
    required: true,
    rules: {
      required: "Email is required",
      pattern: {
        value: /\S+@\S+\.\S+/,
        message: "Enter a valid email address",
      },
    },
    colSpan: 12,
  },
  {
    type: "input",
    name: "password",
    label: "Password",
    inputType: "password",
    placeholder: "Enter your password",
    required: true,
    rules: {
      required: "Password is required",
      minLength: {
        value: 6,
        message: "Password must be at least 6 characters",
      },
    },
    colSpan: 12,
  },
  {
    type: "checkbox",
    name: "rememberMe",
    label: "Remember me for 7 days",
    colSpan: 12,
    fieldWrapperClassName:
      "flex items-center flex-row-reverse justify-end gap-2",
    labelClassName: "mb-0",
  },
];

interface LoginFormProps {
  onSuccess?: (user: unknown) => void;
  onError?: (error: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [open, setOpen] = React.useState(false);
  const [locations, setLocations] = React.useState<LocationData[]>([]);
  const router = useRouter();
  const {
    mutateAsync: login,
    isPending: isLoading,
    isSuccess,
  } = useLoginMutation();
  console.log(isSuccess, "+++++++++++++ isSuccess");
  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const session = await login({ ...values });
      const locs = session.user.locationData ?? [];
      if (locs.length <= 1) {
        // if 1, activeLocationId should already be set in loginRequest()
        router.push("/t/dashboard");
        return;
      }
      setLocations(locs);
      setOpen(true);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Login failed");
    }
  };
  const handleSelect = async (locationId: string) => {
    await setActiveLocationId(locationId);
    setOpen(false);
    router.push("/t/dashboard");
  };

  return (
    <>
      <DynamicForm<LoginInput>
        fields={loginFields}
        defaultValues={{
          email: "",
          password: "",
          rememberMe: false,
        }}
        submitLabel="Sign In"
        isSubmitting={isLoading}
        onSubmit={handleSubmit}
      />
      <LocationSelectModal
        open={open}
        locations={locations}
        onSelect={handleSelect}
      />
    </>
  );
}

export function LoginFormFooterLinks() {
  const searchParams = useSearchParams();
  const tenant =
    searchParams.get("tenant")?.trim() ||
    searchParams.get("tenantSlug")?.trim() ||
    "";
  const tenantQuery =
    tenant !== "" ? `?${new URLSearchParams({ tenant }).toString()}` : "";

  return (
    <div className="flex flex-col gap-2 text-center text-sm">
      <Link
        href={`/forgot-password${tenantQuery}`}
        className="text-primary hover:underline"
      >
        Forgot password?
      </Link>
      {/* <div>
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${tenantQuery}`}
          className="text-primary hover:underline"
        >
          Sign up
        </Link>
      </div> */}
    </div>
  );
}
