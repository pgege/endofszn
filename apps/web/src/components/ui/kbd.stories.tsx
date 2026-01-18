import type { Meta, StoryObj } from '@storybook/react'
import { Kbd, KbdGroup } from './kbd'
import { Command } from 'lucide-react'

const meta: Meta<typeof Kbd> = {
  title: 'UI/Kbd',
  component: Kbd,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Kbd>

export const Default: Story = {
  render: () => <Kbd>K</Kbd>,
}

export const WithIcon: Story = {
  render: () => (
    <Kbd>
      <Command className="size-3" />K
    </Kbd>
  ),
}

export const Group: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>Shift</Kbd>
      <Kbd>P</Kbd>
    </KbdGroup>
  ),
}

export const Shortcuts: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span>Copy</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>C</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between">
        <span>Paste</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>V</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between">
        <span>Save</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </div>
    </div>
  ),
}
