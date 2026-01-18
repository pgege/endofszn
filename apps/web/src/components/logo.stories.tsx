import type { Meta, StoryObj } from '@storybook/react'
import { Logo } from './logo'

const meta: Meta<typeof Logo> = {
  title: 'Components/Logo',
  component: Logo,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['full', 'icon', 'abbreviated', 'stacked'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Logo>

export const Full: Story = {
  args: {
    variant: 'full',
    size: 'md',
  },
}

export const Icon: Story = {
  args: {
    variant: 'icon',
    size: 'md',
  },
}

export const Abbreviated: Story = {
  args: {
    variant: 'abbreviated',
    size: 'md',
  },
}

export const Stacked: Story = {
  args: {
    variant: 'stacked',
    size: 'xl',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <Logo variant="full" size="sm" />
      <Logo variant="full" size="md" />
      <Logo variant="full" size="lg" />
      <Logo variant="full" size="xl" />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <Logo variant="full" size="lg" />
      <Logo variant="icon" size="lg" />
      <Logo variant="abbreviated" size="lg" />
      <Logo variant="stacked" size="xl" />
    </div>
  ),
}
