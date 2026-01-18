import type { Meta, StoryObj } from '@storybook/react'
import { Toaster } from './sonner'
import { Button } from './button'
import { toast } from 'sonner'

const meta: Meta<typeof Toaster> = {
  title: 'UI/Sonner',
  component: Toaster,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Story />
        <Toaster />
      </>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Toaster>

export const Default: Story = {
  render: () => (
    <div className="flex gap-2 flex-wrap">
      <Button onClick={() => toast('Event has been created')}>Default</Button>
      <Button onClick={() => toast.success('Successfully saved!')}>Success</Button>
      <Button onClick={() => toast.error('Something went wrong')}>Error</Button>
      <Button onClick={() => toast.warning('Please check your input')}>Warning</Button>
      <Button onClick={() => toast.info('New update available')}>Info</Button>
    </div>
  ),
}

export const WithDescription: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast.success('Event created', {
          description: 'Your event has been created successfully.',
        })
      }
    >
      Show Toast with Description
    </Button>
  ),
}

export const WithAction: Story = {
  render: () => (
    <Button
      onClick={() =>
        toast('Event created', {
          action: {
            label: 'Undo',
            onClick: () => console.log('Undo'),
          },
        })
      }
    >
      Show Toast with Action
    </Button>
  ),
}

export const Promise: Story = {
  render: () => (
    <Button
      onClick={() => {
        const promise = new Promise((resolve) => setTimeout(resolve, 2000))
        toast.promise(promise, {
          loading: 'Loading...',
          success: 'Data loaded successfully!',
          error: 'Failed to load data',
        })
      }}
    >
      Show Promise Toast
    </Button>
  ),
}
