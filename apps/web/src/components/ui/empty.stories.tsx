import type { Meta, StoryObj } from '@storybook/react'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent, EmptyMedia } from './empty'
import { Button } from './button'
import { FileQuestion, Inbox } from 'lucide-react'

const meta: Meta<typeof Empty> = {
  title: 'UI/Empty',
  component: Empty,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Empty>

export const Default: Story = {
  render: () => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Inbox />
        </EmptyMedia>
        <EmptyTitle>No items found</EmptyTitle>
        <EmptyDescription>
          You don't have any items yet. Start by creating your first one.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create item</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const Simple: Story = {
  render: () => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia>
          <FileQuestion className="size-12 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>No results</EmptyTitle>
        <EmptyDescription>
          Try adjusting your search or filters.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  ),
}
