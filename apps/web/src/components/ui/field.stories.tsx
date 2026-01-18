import type { Meta, StoryObj } from '@storybook/react'
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldSet,
  FieldLegend,
  FieldContent,
} from './field'
import { Input } from './input'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Field> = {
  title: 'UI/Field',
  component: Field,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Field>

export const Default: Story = {
  render: () => (
    <Field>
      <FieldLabel htmlFor="email">Email</FieldLabel>
      <Input id="email" type="email" placeholder="john@example.com" />
      <FieldDescription>We'll never share your email.</FieldDescription>
    </Field>
  ),
}

export const WithError: Story = {
  render: () => (
    <Field data-invalid="true">
      <FieldLabel htmlFor="password">Password</FieldLabel>
      <Input id="password" type="password" />
      <FieldError>Password must be at least 8 characters.</FieldError>
    </Field>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <Field orientation="horizontal">
      <Checkbox id="terms" />
      <FieldContent>
        <FieldLabel htmlFor="terms">Accept terms</FieldLabel>
        <FieldDescription>I agree to the terms and conditions.</FieldDescription>
      </FieldContent>
    </Field>
  ),
}

export const FieldSetExample: Story = {
  render: () => (
    <FieldSet>
      <FieldLegend>Account Information</FieldLegend>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Full Name</FieldLabel>
          <Input id="name" placeholder="John Doe" />
        </Field>
        <Field>
          <FieldLabel htmlFor="email2">Email</FieldLabel>
          <Input id="email2" type="email" placeholder="john@example.com" />
        </Field>
      </FieldGroup>
    </FieldSet>
  ),
}
