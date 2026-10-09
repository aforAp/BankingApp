import {
  Field,
  FieldLabel,
  FieldError
} from "@/components/ui/field";
import {Inputs} from "@/components/ui/input";
import { Control, Controller, FieldPath } from 'react-hook-form'
import { authFormSchema } from "@/lib/utils";
import {z} from 'zod';

const formSchema = authFormSchema('sign-up');

interface CustomInputProps {
  control: Control<z.infer<typeof formSchema>>;
  name: FieldPath<z.infer<typeof formSchema>>;
  label: string;
  placeholder: string;
}

const CustomInput = ({control, name, label, placeholder}: CustomInputProps) => {
  return (
    <Field>
            <Controller
              name={name}
              control={control}
              render={({ field, fieldState }) => (
                <div className="form-item">
                  <FieldLabel htmlFor="form-rhf-input-username">
                    {label}
                  </FieldLabel>
                  <div className="flex w-full flex-col">
                  <Inputs
                    {...field}
                    value={field.value ?? ""}
                    id="form-rhf-input-username"
                    aria-invalid={fieldState.invalid}
                    className="input-class"
                    placeholder={placeholder}
                    type={name==='password' ? 'password': 'text'}
                    autoComplete="username"
                  />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} className="form-message mt-2" />
                  )}
                </div>
              )}
            />
          </Field>
  )
}

export default CustomInput
