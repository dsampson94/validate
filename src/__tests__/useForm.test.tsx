import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm, withFormField } from '../index';

interface FormValues {
    username: string;
    email: string;
    age: number;
}

const validationRules = {
    username: {
        required: 'Username is required',
        minLength: { value: 3, message: 'Username must be at least 3 characters' },
        custom: {
            validate: async (value: string) => value !== 'taken',
            message: 'Username is already taken',
        },
    },
    email: {
        required: 'Email is required',
        pattern: { value: /^[^@]+@[^@]+\.[^@]+$/, message: 'Invalid email address' },
    },
    age: {
        required: 'Age is required',
        custom: { validate: (value: number) => value >= 18, message: 'You must be at least 18 years old' },
    },
};

const SimpleInput = ({ value, onChange, ...props }: { value: any; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input value={value} onChange={onChange} {...props} />
);

const TestForm = () => {
    const form = useForm<FormValues>({ validationRules, initialValues: { username: '', email: '', age: 0 } });
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState(0);

    const UsernameField = withFormField(SimpleInput, form);
    const EmailField = withFormField(SimpleInput, form);
    const AgeField = withFormField(SimpleInput, form);

    const handleFormSubmit = async (values: FormValues) => {
        console.log('Form Data:', values);
        // Simulate async form submission
        await new Promise((resolve) => setTimeout(resolve, 2000));
    };

    return (
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <UsernameField name="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <EmailField name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <AgeField name="age" value={age} onChange={(e) => setAge(Number(e.target.value))} placeholder="Age" type="number" />
            <button type="submit" disabled={form.isSubmitting}>
                {form.isSubmitting ? 'Submitting...' : 'Sign Up'}
            </button>
        </form>
    );
};

const NonFormValidation = () => {
    const form = useForm<FormValues>({ validationRules, initialValues: { username: '', email: '', age: 0 } });
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [age, setAge] = useState(0);

    return (
        <div>
            <div>
                <input
                    name="username"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value);
                        form.handleChange('username', e.target.value);
                    }}
                    placeholder="Username"
                />
                {form.errors.username && <div style={{ color: 'red' }}>{form.errors.username}</div>}
            </div>
            <div>
                <input
                    name="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        form.handleChange('email', e.target.value);
                    }}
                    placeholder="Email"
                />
                {form.errors.email && <div style={{ color: 'red' }}>{form.errors.email}</div>}
            </div>
            <div>
                <input
                    name="age"
                    type="number"
                    value={age}
                    onChange={(e) => {
                        setAge(Number(e.target.value));
                        form.handleChange('age', Number(e.target.value));
                    }}
                    placeholder="Age"
                />
                {form.errors.age && <div style={{ color: 'red' }}>{form.errors.age}</div>}
            </div>
        </div>
    );
};

describe('useForm Hook and withFormField HOC', () => {
    it('should validate form fields and handle form submission', async () => {
        render(<TestForm />);

        // Test initial form state
        expect(screen.getByPlaceholderText('Username')).toHaveValue('');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('');
        expect(screen.getByPlaceholderText('Age')).toHaveValue(0);

        // Simulate user input and form submission
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'taken' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
        fireEvent.change(screen.getByPlaceholderText('Age'), { target: { value: '17' } });

        fireEvent.click(screen.getByText('Sign Up'));

        // Wait for validation errors to be displayed
        await waitFor(() => {
            expect(screen.getByText('Username is already taken')).toBeInTheDocument();
            expect(screen.getByText('Invalid email address')).toBeInTheDocument();
            expect(screen.getByText('You must be at least 18 years old')).toBeInTheDocument();
        });

        // Correct the form inputs
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'validUsername' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'valid@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Age'), { target: { value: '18' } });

        fireEvent.click(screen.getByText('Sign Up'));

        // Wait for form submission
        await waitFor(() => {
            expect(screen.queryByText('Username is already taken')).not.toBeInTheDocument();
            expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
            expect(screen.queryByText('You must be at least 18 years old')).not.toBeInTheDocument();
        });
    });

    it('should validate fields outside a form context', async () => {
        render(<NonFormValidation />);

        // Test initial state
        expect(screen.getByPlaceholderText('Username')).toHaveValue('');
        expect(screen.getByPlaceholderText('Email')).toHaveValue('');
        expect(screen.getByPlaceholderText('Age')).toHaveValue(0);

        // Simulate user input with errors
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: '' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'invalid-email' } });
        fireEvent.change(screen.getByPlaceholderText('Age'), { target: { value: '17' } });

        // Wait for validation errors to be displayed
        await waitFor(() => {
            expect(screen.getByText('Username is required')).toBeInTheDocument();
            expect(screen.getByText('Invalid email address')).toBeInTheDocument();
            expect(screen.getByText('You must be at least 18 years old')).toBeInTheDocument();
        });

        // Correct the inputs
        fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'validUsername' } });
        fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'valid@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('Age'), { target: { value: '18' } });

        // Wait for validation errors to be removed
        await waitFor(() => {
            expect(screen.queryByText('Username is required')).not.toBeInTheDocument();
            expect(screen.queryByText('Invalid email address')).not.toBeInTheDocument();
            expect(screen.queryByText('You must be at least 18 years old')).not.toBeInTheDocument();
        });
    });
});
