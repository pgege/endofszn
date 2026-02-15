import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateStore } from '@/lib/api/auth'
import { paths } from '@/config/paths'

const createStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100),
  description: z.string().max(1000).optional(),
  tagline: z.string().max(200).optional(),
})

type CreateStoreFormData = z.infer<typeof createStoreSchema>

export default function NewStorePage() {
  const createStoreMutation = useCreateStore()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateStoreFormData>({
    resolver: zodResolver(createStoreSchema),
    defaultValues: {
      name: '',
      description: '',
      tagline: '',
    },
  })

  const onSubmit = (data: CreateStoreFormData) => {
    createStoreMutation.mutate(data, {
      onSuccess: (store) => {
        navigate(paths.app.stores.detail.getHref(store.id))
      },
      onError: (err) => {
        setError('root', {
          message: err instanceof Error ? err.message : 'Failed to create store',
        })
      },
    })
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={paths.app.stores.list.getHref()}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-base font-semibold">Create a new store</h1>
          <p className="text-muted-foreground">
            Set up your store to start selling products
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store Details</CardTitle>
          <CardDescription>
            You can add more details later in store settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errors.root && (
              <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50">
                {errors.root.message}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Store Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Store"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                placeholder="A short catchy phrase for your store"
                {...register('tagline')}
              />
              {errors.tagline && (
                <p className="text-sm text-red-500">{errors.tagline.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell customers what your store is about..."
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(paths.app.stores.list.getHref())}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || createStoreMutation.isPending}
              >
                {createStoreMutation.isPending ? 'Creating...' : 'Create Store'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
