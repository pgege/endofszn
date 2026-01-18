import type { Meta, StoryObj } from '@storybook/react'
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
  ItemSeparator,
} from './item'
import { Button } from './button'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge } from './badge'
import { MoreHorizontal, User, Settings, CreditCard } from 'lucide-react'

const meta: Meta<typeof Item> = {
  title: 'UI/Item',
  component: Item,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Item>

export const Default: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="icon">
        <User />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Account Settings</ItemTitle>
        <ItemDescription>Manage your account preferences</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </ItemActions>
    </Item>
  ),
}

export const WithAvatar: Story = {
  render: () => (
    <Item>
      <ItemMedia variant="image">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>
          John Doe
          <Badge variant="secondary">Admin</Badge>
        </ItemTitle>
        <ItemDescription>john@example.com</ItemDescription>
      </ItemContent>
    </Item>
  ),
}

export const Outline: Story = {
  render: () => (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <CreditCard />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Payment Method</ItemTitle>
        <ItemDescription>Visa ending in 4242</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="outline" size="sm">
          Edit
        </Button>
      </ItemActions>
    </Item>
  ),
}

export const List: Story = {
  render: () => (
    <ItemGroup className="border rounded-lg">
      <Item>
        <ItemMedia variant="icon">
          <User />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Profile</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <Settings />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Settings</ItemTitle>
        </ItemContent>
      </Item>
      <ItemSeparator />
      <Item>
        <ItemMedia variant="icon">
          <CreditCard />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Billing</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
}
