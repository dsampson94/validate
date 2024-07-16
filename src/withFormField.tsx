import React from 'react';
import { useForm } from './useForm';

interface FormFieldProps {
    name: string;
    value: any;
    onChange: (e: any) => void;
    showErrorInline?: boolean;
    customErrorComponent?: React.ReactNode;
}

export const withFormField = <P extends object>(
    Component: React.ComponentType<P>,
    useFormHook: ReturnType<typeof useForm>
) => {
    return ({
                name,
                value,
                onChange,
                showErrorInline = false,
                customErrorComponent,
                ...props
            }: FormFieldProps & P & React.JSX.IntrinsicElements['input']) => {
        const { errors, handleChange } = useFormHook;

        const handleComponentChange = (e: any) => {
            onChange(e);
            handleChange(name, e.target.value);
        };

        return (
            <div>
                <Component
                    {...props as P}
                    name={name}
                    value={value}
                    onChange={handleComponentChange}
                />
                {errors[name] && (
                    <>
                        {customErrorComponent ? (
                            customErrorComponent
                        ) : showErrorInline ? (
                            <span style={{ color: 'red', marginLeft: '8px' }}>{errors[name]}</span>
                        ) : (
                            <div style={{ color: 'red' }}>{errors[name]}</div>
                        )}
                    </>
                )}
            </div>
        );
    };
};
