import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import type { UseFormRegister, FieldErrors } from 'react-hook-form'

interface SettingsFormData {
  name: string
  description?: string
  tagline?: string
  contact_email?: string
  contact_phone?: string
  website_url?: string
  instagram_url?: string
  twitter_url?: string
  facebook_url?: string
  shipping_policy?: string
  returns_policy?: string
  warranty_policy?: string
  is_published?: boolean
  accepts_orders?: boolean
}

interface SectionProps {
  register: UseFormRegister<SettingsFormData>
  errors: FieldErrors<SettingsFormData>
}

export function BasicInfoSection({ register, errors }: SectionProps) {
  return (
    <Card id="settings-profile">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>General information about your store</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Store Name *</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" placeholder="A short catchy phrase" {...register('tagline')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" rows={4} placeholder="Tell customers about your store..." {...register('description')} />
        </div>
      </CardContent>
    </Card>
  )
}

export function ContactSection({ register, errors }: SectionProps) {
  return (
    <Card id="settings-contact">
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>How customers can reach you</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input id="contact_email" type="email" placeholder="contact@yourstore.com" {...register('contact_email')} />
          {errors.contact_email && <p className="text-sm text-red-500">{errors.contact_email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input id="contact_phone" placeholder="+1 (555) 123-4567" {...register('contact_phone')} />
        </div>
      </CardContent>
    </Card>
  )
}

export function SocialLinksSection({ register, errors }: SectionProps) {
  return (
    <Card id="settings-social">
      <CardHeader>
        <CardTitle>Social Links</CardTitle>
        <CardDescription>Your store's online presence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website_url">Website</Label>
          <Input id="website_url" placeholder="https://yourstore.com" {...register('website_url')} />
          {errors.website_url && <p className="text-sm text-red-500">{errors.website_url.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram_url">Instagram</Label>
          <Input id="instagram_url" placeholder="@yourstore" {...register('instagram_url')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="twitter_url">Twitter</Label>
          <Input id="twitter_url" placeholder="@yourstore" {...register('twitter_url')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebook_url">Facebook</Label>
          <Input id="facebook_url" placeholder="yourstore" {...register('facebook_url')} />
        </div>
      </CardContent>
    </Card>
  )
}

export function PoliciesSection({
  shippingPolicy, setShippingPolicy,
  returnsPolicy, setReturnsPolicy,
  warrantyPolicy, setWarrantyPolicy,
  setValue,
}: {
  shippingPolicy: string
  setShippingPolicy: (v: string) => void
  returnsPolicy: string
  setReturnsPolicy: (v: string) => void
  warrantyPolicy: string
  setWarrantyPolicy: (v: string) => void
  setValue: (name: string, value: string, options?: { shouldDirty?: boolean }) => void
}) {
  return (
    <Card id="settings-policies">
      <CardHeader>
        <CardTitle>Store Policies</CardTitle>
        <CardDescription>Define your store's shipping, returns, and warranty policies. These will be displayed on product pages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Shipping Policy</Label>
          <p className="text-sm text-muted-foreground mb-2">Describe your shipping methods, delivery times, and regions served.</p>
          <RichTextEditor
            value={shippingPolicy}
            onChange={(value) => { setShippingPolicy(value); setValue('shipping_policy', value, { shouldDirty: true }) }}
            placeholder="e.g., Free shipping on orders over $50. Standard delivery takes 3-5 business days..."
          />
        </div>
        <div className="space-y-2">
          <Label>Returns Policy</Label>
          <p className="text-sm text-muted-foreground mb-2">Explain your return and exchange policies.</p>
          <RichTextEditor
            value={returnsPolicy}
            onChange={(value) => { setReturnsPolicy(value); setValue('returns_policy', value, { shouldDirty: true }) }}
            placeholder="e.g., 30-day return policy. Items must be unworn with original tags..."
          />
        </div>
        <div className="space-y-2">
          <Label>Warranty Policy</Label>
          <p className="text-sm text-muted-foreground mb-2">Describe any warranty or guarantee you offer on products.</p>
          <RichTextEditor
            value={warrantyPolicy}
            onChange={(value) => { setWarrantyPolicy(value); setValue('warranty_policy', value, { shouldDirty: true }) }}
            placeholder="e.g., 1-year manufacturer warranty on all products..."
          />
        </div>
      </CardContent>
    </Card>
  )
}

export function StoreStatusSection({
  isPublished, acceptsOrders, setValue,
}: {
  isPublished: boolean | undefined
  acceptsOrders: boolean | undefined
  setValue: (name: string, value: boolean, options?: { shouldDirty?: boolean }) => void
}) {
  return (
    <Card id="settings-status">
      <CardHeader>
        <CardTitle>Store Status</CardTitle>
        <CardDescription>Control your store's visibility and operations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="is_published">Published</Label>
            <p className="text-sm text-muted-foreground">Make your store visible to customers</p>
          </div>
          <Switch id="is_published" checked={isPublished} onCheckedChange={(checked) => setValue('is_published', checked, { shouldDirty: true })} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="accepts_orders">Accept Orders</Label>
            <p className="text-sm text-muted-foreground">Allow customers to place orders</p>
          </div>
          <Switch id="accepts_orders" checked={acceptsOrders} onCheckedChange={(checked) => setValue('accepts_orders', checked, { shouldDirty: true })} />
        </div>
      </CardContent>
    </Card>
  )
}

export function DangerZoneSection({
  storeName, showConfirm, setShowConfirm, onDelete, isPending,
}: {
  storeName: string
  showConfirm: boolean
  setShowConfirm: (v: boolean) => void
  onDelete: () => void
  isPending: boolean
}) {
  return (
    <Card id="settings-danger" className="border-red-200 dark:border-red-900">
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
        <CardDescription>Irreversible actions for your store</CardDescription>
      </CardHeader>
      <CardContent>
        {showConfirm ? (
          <div className="space-y-4">
            <p className="text-sm">Are you sure you want to delete <strong>{storeName}</strong>? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={onDelete} disabled={isPending}>
                {isPending ? 'Deleting...' : 'Yes, Delete Store'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-2" />Delete Store
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
