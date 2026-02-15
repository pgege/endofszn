import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useStores, useUpdateStore, useDeleteStore } from '@/lib/api/auth'
import { paths, SETTINGS_SECTIONS, type SettingsSection } from '@/config/paths'
import { useEffect, useState, useRef } from 'react'
import {
  BasicInfoSection,
  ContactSection,
  SocialLinksSection,
  PoliciesSection,
  StoreStatusSection,
  DangerZoneSection,
} from './settings/components/settings-sections'
import { useStoreId } from './store-context'

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
  shipping_policy: z.string().optional(),
  returns_policy: z.string().optional(),
  warranty_policy: z.string().optional(),
  is_published: z.boolean().optional(),
  accepts_orders: z.boolean().optional(),
})

type UpdateStoreFormData = z.infer<typeof updateStoreSchema>

export default function StoreSettingsPage() {
  const storeId = useStoreId()
  const navigate = useNavigate()
  const { data: storesData, isLoading, error } = useStores({ id: [storeId] })
  const store = storesData?.stores[0]
  const updateStoreMutation = useUpdateStore(storeId)
  const deleteStoreMutation = useDeleteStore()
  const [searchParams] = useSearchParams()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const scrolledRef = useRef(false)

  const {
    register, handleSubmit, setError, reset, watch, setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateStoreFormData>({ resolver: zodResolver(updateStoreSchema) })

  const isPublished = watch('is_published')
  const acceptsOrders = watch('accepts_orders')

  const [shippingPolicy, setShippingPolicy] = useState('')
  const [returnsPolicy, setReturnsPolicy] = useState('')
  const [warrantyPolicy, setWarrantyPolicy] = useState('')

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (store && !scrolledRef.current) {
      const sectionParam = searchParams.get('section') as SettingsSection | null
      if (sectionParam && sectionParam in SETTINGS_SECTIONS) {
        scrolledRef.current = true
        timer = setTimeout(() => {
          document.getElementById(`settings-${sectionParam}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    }
    return () => { if (timer) clearTimeout(timer) }
  }, [store, searchParams])

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
        shipping_policy: store.profile?.shippingPolicy || '',
        returns_policy: store.profile?.returnsPolicy || '',
        warranty_policy: store.profile?.warrantyPolicy || '',
        is_published: store.profile?.isPublished || false,
        accepts_orders: store.profile?.acceptsOrders || false,
      })
      setShippingPolicy(store.profile?.shippingPolicy || '')
      setReturnsPolicy(store.profile?.returnsPolicy || '')
      setWarrantyPolicy(store.profile?.warrantyPolicy || '')
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
        shipping_policy: shippingPolicy || null,
        returns_policy: returnsPolicy || null,
        warranty_policy: warrantyPolicy || null,
        is_published: data.is_published,
        accepts_orders: data.accepts_orders,
      },
      {
        onSuccess: () => reset(data),
        onError: (err) => setError('root', { message: err instanceof Error ? err.message : 'Failed to update store' }),
      }
    )
  }

  const handleDelete = () => {
    deleteStoreMutation.mutate(storeId, { onSuccess: () => navigate(paths.app.stores.list.getHref()) })
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
        <Button asChild><Link to={paths.app.stores.list.getHref()}>Back to Stores</Link></Button>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to={paths.app.stores.detail.getHref(store.id)}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-base font-semibold">Store Settings</h1>
            <p className="text-muted-foreground">{store.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {errors.root && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50">{errors.root.message}</div>
          )}
          <BasicInfoSection register={register} errors={errors} />
          <ContactSection register={register} errors={errors} />
          <SocialLinksSection register={register} errors={errors} />
          <PoliciesSection
            shippingPolicy={shippingPolicy} setShippingPolicy={setShippingPolicy}
            returnsPolicy={returnsPolicy} setReturnsPolicy={setReturnsPolicy}
            warrantyPolicy={warrantyPolicy} setWarrantyPolicy={setWarrantyPolicy}
            setValue={setValue as any}
          />
          <StoreStatusSection isPublished={isPublished} acceptsOrders={acceptsOrders} setValue={setValue as any} />
          <div className="flex justify-end gap-3">
            <Button type="submit" disabled={!isDirty || isSubmitting || updateStoreMutation.isPending}>
              {updateStoreMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

        <DangerZoneSection
          storeName={store.name}
          showConfirm={showDeleteConfirm}
          setShowConfirm={setShowDeleteConfirm}
          onDelete={handleDelete}
          isPending={deleteStoreMutation.isPending}
        />
      </div>
    </div>
  )
}
