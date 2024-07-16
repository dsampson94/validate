import { useState, useCallback } from 'react';

interface ValidationRule {
    required?: string;
    minLength?: { value: number; message: string };
    maxLength?: { value: number; message: string };
    pattern?: { value: RegExp; message: string };
    custom?: { validate: (value: any) => boolean | Promise<boolean>; message: string };
}

interface ValidationRules {
    [key: string]: ValidationRule;
}

interface FormErrors {
    [key: string]: string;
}

interface UseFormProps<T> {
    initialValues?: T;
    validationRules?: ValidationRules;
    debounceTime?: number;
}

export function useForm<T extends { [key: string]: any }>({
                                                              initialValues = {} as T,
                                                              validationRules = {},
                                                              debounceTime = 300,
                                                          }: UseFormProps<T>) {
    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isValidating, setIsValidating] = useState<boolean>(false);

    const debounce = (func: Function, delay: number) => {
        let debounceTimer: NodeJS.Timeout;
        return (...args: any) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func(...args), delay);
        };
    };

    const validateField = useCallback(
        async (name: string, value: any) => {
            const rules = validationRules[name];
            let error = '';

            if (rules) {
                if (rules.required && !value) {
                    error = rules.required;
                } else if (rules.minLength && value.length < rules.minLength.value) {
                    error = rules.minLength.message;
                } else if (rules.maxLength && value.length > rules.maxLength.value) {
                    error = rules.maxLength.message;
                } else if (rules.pattern && !rules.pattern.value.test(value)) {
                    error = rules.pattern.message;
                } else if (rules.custom) {
                    const isValid = await rules.custom.validate(value);
                    if (!isValid) {
                        error = rules.custom.message;
                    }
                }
            }

            setErrors((prevErrors) => ({ ...prevErrors, [name]: error }));
        },
        [validationRules]
    );

    const debouncedValidateField = useCallback(debounce(validateField, debounceTime), [validateField, debounceTime]);

    const handleChange = (name: string, value: any) => {
        setValues((prevValues) => ({ ...prevValues, [name]: value }));
        debouncedValidateField(name, value);
    };

    const validateForm = useCallback(
        async (values: T) => {
            const newErrors: FormErrors = {};
            setIsValidating(true);

            for (const name in validationRules) {
                const value = values[name];
                const rules = validationRules[name];
                let error = '';

                if (rules) {
                    if (rules.required && !value) {
                        error = rules.required;
                    } else if (rules.minLength && value.length < rules.minLength.value) {
                        error = rules.minLength.message;
                    } else if (rules.maxLength && value.length > rules.maxLength.value) {
                        error = rules.maxLength.message;
                    } else if (rules.pattern && !rules.pattern.value.test(value)) {
                        error = rules.pattern.message;
                    } else if (rules.custom) {
                        const isValid = await rules.custom.validate(value);
                        if (!isValid) {
                            error = rules.custom.message;
                        }
                    }
                }

                if (error) {
                    newErrors[name] = error;
                }
            }

            setErrors(newErrors);
            setIsValidating(false);
            return Object.keys(newErrors).length === 0;
        },
        [validationRules]
    );

    const handleSubmit = useCallback(
        (callback: (values: T) => void) => async (event: React.FormEvent) => {
            event.preventDefault();
            setIsSubmitting(true);
            if (await validateForm(values)) {
                await callback(values);
            }
            setIsSubmitting(false);
        },
        [validateForm, values]
    );

    const resetForm = useCallback(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    return {
        values,
        errors,
        isValidating,
        isSubmitting,
        handleChange,
        handleSubmit,
        validateField,
        resetForm,
    };
}
