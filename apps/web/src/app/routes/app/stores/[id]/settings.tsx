import { Link, useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { useStore, useUpdateStore, useDeleteStore } from '@/lib/api/auth'
import { paths } from '@/config/paths'
import { useEffect, useState } from 'react'

const updateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  description: z.string().max(1000).optional(),
  tagline: z.string().max(200).optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  instagram_url: z.string().optional(),
  twitter_url: z.string().optional(),
  facebook_url: z.string().optional(),
  is_published: z.boolean().optional(),
  accepts_orders: z.boolean().optional(),
})

type UpdateStoreFormData = z.infer<typeof updateStoreSchema>

export default function StoreSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: store, isLoading, error } = useStore(id!)
  const updateStoreMutation = useUpdateStore(id!)
  const deleteStoreMutation = useDeleteStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateStoreFormData>({
    resolver: zodResolver(updateStoreSchema),
  })

  const isPublished = watch('is_published')
  const acceptsOrders = watch('accepts_orders')

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        description: store.profile?.description || '',
        tagline: store.profile?.tagline || '',
        contact_email: store.profile?.contactEmail || '',
        contact_phone: store.profile?.contactPhone || '',
        website_url: store.profile?.socialLinks?.website || '',
        instagram_url: store.profile?.socialLinks?.instagram || '',
        twitter_url: store.profile?.socialLinks?.twitter || '',
        facebook_url: store.profile?.socialLinks?.facebook || '',
        is_published: store.profile?.isPublished || false,
        accepts_orders: store.profile?.acceptsOrders || false,
      })
    }
  }, [store, reset])

  const onSubmit = (data: UpdateStoreFormData) => {
    updateStoreMutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        tagline: data.tagline || undefined,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        website_url: data.website_url || null,
        instagram_url: data.instagram_url || null,
        twitter_url: data.twitter_url || null,
        facebook_url: data.facebook_url || null,
        is_published: data.is_published,
        accepts_orders: data.accepts_orders,
      },
      {
        onSuccess: () => {
          reset(data)
        },
        onError: (err) => {
          setError('root', {
            message: err instanceof Error ? err.message : 'Failed to update store',
          })
        },
      }
    )
  }

  const handleDelete = () => {
    deleteStoreMutation.mutate(id!, {
      onSuccess: () => {
        navigate(paths.app.root.getHref())
      },
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Store not found</h2>
        <Button asChild>
          <Link to={paths.app.root.getHref()}>Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={paths.app.stores.detail.getHref(store.id)}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Store Settings</h1>
          <p className="text-muted-foreground">{store.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errors.root && (
          <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md">
            {errors.root.message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              General information about your store
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="A short catchy phrase"
                {...register('tagline')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Tell customers about your store..."
                {...register('description')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              How customers can reach you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contact@yourstore.com"
                {...register('contact_email')}
              />
              {errors.contact_email && (
                <p className="text-sm text-red-500">{errors.contact_email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                placeholder="+1 (555) 123-4567"
                {...register('contact_phone')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>
              Your store's online presence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="website_url">Website</Label>
              <Input
                id="website_url"
                placeholder="https://yourstore.com"
                {...register('website_url')}
              />
              {errors.website_url && (
                <p className="text-sm text-red-500">{errors.website_url.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input
                id="instagram_url"
                placeholder="@yourstore"
                {...register('instagram_url')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="twitter_url">Twitter</Label>
              <Input
                id="twitter_url"
                placeholder="@yourstore"
                {...register('twitter_url')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook_url">Facebook</Label>
              <Input
                id="facebook_url"
                placeholder="yourstore"
                {...register('facebook_url')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store Status</CardTitle>
            <CardDescription>
              Control your store's visibility and operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_published">Published</Label>
                <p className="text-sm text-muted-foreground">
                  Make your store visible to customers
                </p>
              </div>
              <Switch
                id="is_published"
                checked={isPublished}
                onCheckedChange={(checked) => setValue('is_published', checked, { shouldDirty: true })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="accepts_orders">Accept Orders</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to place orders
                </p>
              </div>
              <Switch
                id="accepts_orders"
                checked={acceptsOrders}
                onCheckedChange={(checked) => setValue('accepts_orders', checked, { shouldDirty: true })}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || updateStoreMutation.isPending}
          >
            {updateStoreMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your store
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showDeleteConfirm ? (
            <div className="space-y-4">
              <p className="text-sm">
                Are you sure you want to delete <strong>{store.name}</strong>? This action
                cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteStoreMutation.isPending}
                >
                  {deleteStoreMutation.isPending ? 'Deleting...' : 'Yes, Delete Store'}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Store
            </Button>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
