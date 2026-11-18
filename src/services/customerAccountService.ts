import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  CustomerProfile,
  OrderRecord,
  ServiceBooking,
} from '../types/store';
import { formatOrderItemsSummary } from '../utils/storeLogic';

function sanitizeWishlist(ids: string[]): string[] {
  return Array.from(
    new Set(
      ids
        .filter((id) => typeof id === 'string' && id.trim().length > 0)
        .map((id) => id.trim().slice(0, 64))
    )
  ).slice(0, 50);
}

export async function ensureCustomerDocs(
  user: User,
  localWishlistIds: string[]
): Promise<void> {
  if (!db) return;
  const uid = user.uid;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/profile`;
  const userRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'profile');

  const safeDisplayName = (user.displayName || user.email?.split('@')[0] || 'kcross india store Customer')
    .trim()
    .slice(0, 120);
  const safePhoto = (user.photoURL || '').trim().slice(0, 500);
  const safeEmail = (user.email || 'customer@kcrossindia.store').trim().slice(0, 160);

  let userSnap;
  try {
    userSnap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (!userSnap.exists()) {
    try {
      await setDoc(userRef, {
        uid,
        displayName: safeDisplayName,
        ...(safePhoto ? { photoURL: safePhoto } : {}),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, userPath);
    }
  }

  let privateSnap;
  try {
    privateSnap = await getDoc(privateRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, privatePath);
  }

  if (!privateSnap.exists()) {
    try {
      await setDoc(privateRef, {
        uid,
        email: safeEmail,
        defaultAddress: '',
        defaultCity: '',
        defaultPinCode: '',
        wishlistIds: sanitizeWishlist(localWishlistIds),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  }
}

export async function saveCustomerDeliveryProfile(
  uid: string,
  payload: {
    displayName: string;
    email: string;
    defaultAddress: string;
    defaultCity: string;
    defaultPinCode: string;
    wishlistIds: string[];
  }
): Promise<void> {
  if (!db) return;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/profile`;
  const cleanName = payload.displayName.trim().slice(0, 120);
  const cleanEmail = payload.email.trim().slice(0, 160);
  const cleanAddress = payload.defaultAddress.trim().slice(0, 300);
  const cleanCity = payload.defaultCity.trim().slice(0, 80);
  const rawPin = payload.defaultPinCode.trim();
  const cleanPin = /^[1-9][0-9]{5}$/.test(rawPin) ? rawPin : '';
  const cleanWishlist = sanitizeWishlist(payload.wishlistIds);

  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: cleanName,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }

  try {
    await updateDoc(doc(db, 'users', uid, 'private', 'profile'), {
      email: cleanEmail,
      defaultAddress: cleanAddress,
      defaultCity: cleanCity,
      defaultPinCode: cleanPin,
      wishlistIds: cleanWishlist,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, privatePath);
  }
}

export async function syncWishlistToCloud(
  uid: string,
  wishlistIds: string[]
): Promise<void> {
  if (!db) return;
  const privatePath = `users/${uid}/private/profile`;
  try {
    await updateDoc(doc(db, 'users', uid, 'private', 'profile'), {
      wishlistIds: sanitizeWishlist(wishlistIds),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, privatePath);
  }
}

export async function saveOrderToCloud(
  uid: string,
  order: OrderRecord
): Promise<void> {
  if (!db) return;
  const orderId = order.orderNumber.replace(/[^A-Z0-9-]/gi, '').slice(0, 32);
  const orderPath = `users/${uid}/orders/${orderId}`;
  const { itemsSummary, itemCount } = formatOrderItemsSummary(order.items);

  try {
    await setDoc(doc(db, 'users', uid, 'orders', orderId), {
      uid,
      orderNumber: orderId,
      status: 'Confirmed',
      paymentMethod: order.paymentMethod,
      customerName: order.customerName.trim().slice(0, 120),
      email: order.email.trim().slice(0, 160),
      address: order.address.trim().slice(0, 300),
      city: order.city.trim().slice(0, 80),
      pinCode: order.pinCode.trim().slice(0, 6),
      itemsSummary,
      itemCount,
      subtotal: Math.max(0, Number(order.subtotal)),
      ...(order.couponCode ? { couponCode: order.couponCode.trim().slice(0, 32) } : {}),
      couponDiscount: Math.max(0, Number(order.couponDiscount)),
      shippingFee: Math.max(0, Number(order.shippingFee)),
      total: Math.max(0, Number(order.total)),
      estimatedDelivery: order.estimatedDelivery.trim().slice(0, 140),
      placedAt: order.placedAt.slice(0, 40),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, orderPath);
  }
}

export async function saveBookingToCloud(
  uid: string,
  booking: ServiceBooking
): Promise<void> {
  if (!db) return;
  const bookingId = booking.id.replace(/[^A-Z0-9-]/gi, '').slice(0, 32);
  const bookingPath = `users/${uid}/bookings/${bookingId}`;

  try {
    await setDoc(doc(db, 'users', uid, 'bookings', bookingId), {
      uid,
      bookingCode: bookingId,
      serviceId: booking.serviceId.trim().slice(0, 64),
      serviceName: booking.serviceName.trim().slice(0, 140),
      storeId: booking.storeId.trim().slice(0, 64),
      storeName: booking.storeName.trim().slice(0, 140),
      date: booking.date.trim().slice(0, 20),
      timeSlot: booking.timeSlot.trim().slice(0, 24),
      customerName: booking.customerName.trim().slice(0, 120),
      email: booking.email.trim().slice(0, 160),
      notes: booking.notes.trim().slice(0, 400),
      status: 'Confirmed',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, bookingPath);
  }
}

export function subscribeCustomerData(
  user: User,
  callbacks: {
    onProfile: (profile: CustomerProfile) => void;
    onOrders: (orders: OrderRecord[]) => void;
    onBookings: (bookings: ServiceBooking[]) => void;
  }
): () => void {
  if (!db) return () => {};
  const uid = user.uid;
  let accountName = user.displayName || user.email?.split('@')[0] || 'kcross india store Customer';
  let accountPhoto = user.photoURL || undefined;
  let privateData: Partial<CustomerProfile> = {
    email: user.email || '',
    defaultAddress: '',
    defaultCity: '',
    defaultPinCode: '',
    wishlistIds: [],
  };

  const emitProfile = () => {
    callbacks.onProfile({
      uid,
      displayName: accountName,
      email: privateData.email || user.email || '',
      photoURL: accountPhoto,
      defaultAddress: privateData.defaultAddress || '',
      defaultCity: privateData.defaultCity || '',
      defaultPinCode: privateData.defaultPinCode || '',
      wishlistIds: privateData.wishlistIds || [],
    });
  };

  const userPath = `users/${uid}`;
  const unsubUser = onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (typeof d.displayName === 'string') accountName = d.displayName;
        if (typeof d.photoURL === 'string') accountPhoto = d.photoURL;
        emitProfile();
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, userPath)
  );

  const privatePath = `users/${uid}/private/profile`;
  const unsubPrivate = onSnapshot(
    doc(db, 'users', uid, 'private', 'profile'),
    (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        privateData = {
          email: typeof d.email === 'string' ? d.email : user.email || '',
          defaultAddress: typeof d.defaultAddress === 'string' ? d.defaultAddress : '',
          defaultCity: typeof d.defaultCity === 'string' ? d.defaultCity : '',
          defaultPinCode: typeof d.defaultPinCode === 'string' ? d.defaultPinCode : '',
          wishlistIds: Array.isArray(d.wishlistIds)
            ? d.wishlistIds.filter((id): id is string => typeof id === 'string')
            : [],
        };
        emitProfile();
      }
    },
    (error) => handleFirestoreError(error, OperationType.GET, privatePath)
  );

  const ordersPath = `users/${uid}/orders`;
  const ordersQuery = query(
    collection(db, 'users', uid, 'orders'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const unsubOrders = onSnapshot(
    ordersQuery,
    (snap) => {
      const list: OrderRecord[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const summary = typeof d.itemsSummary === 'string' ? d.itemsSummary : 'Order Items';
        const count = typeof d.itemCount === 'number' ? d.itemCount : 1;
        return {
          orderNumber: String(d.orderNumber || docSnap.id),
          placedAt: String(d.placedAt || new Date().toISOString()),
          status: (d.status as OrderRecord['status']) || 'Confirmed',
          paymentMethod: (d.paymentMethod as OrderRecord['paymentMethod']) || 'UPI',
          customerName: String(d.customerName || ''),
          email: String(d.email || ''),
          address: String(d.address || ''),
          city: String(d.city || ''),
          pinCode: String(d.pinCode || ''),
          items: [
            {
              key: `cloud::${docSnap.id}`,
              productId: 'cloud-summary',
              brand: 'kcross india store',
              name: summary,
              variantLabel: `${count} item${count === 1 ? '' : 's'}`,
              price: Number(d.subtotal || d.total || 0),
              mrp: null,
              quantity: 1,
              visualForm: 'serum',
              surfaceTone: '#FFF3EB',
              accentTone: '#C2410C',
            },
          ],
          subtotal: Number(d.subtotal || 0),
          couponCode: typeof d.couponCode === 'string' ? d.couponCode : null,
          couponDiscount: Number(d.couponDiscount || 0),
          shippingFee: Number(d.shippingFee || 0),
          total: Number(d.total || 0),
          estimatedDelivery: String(
            d.estimatedDelivery || 'Dispatching within 24 hours · 2–4 working days'
          ),
        };
      });
      callbacks.onOrders(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, ordersPath)
  );

  const bookingsPath = `users/${uid}/bookings`;
  const bookingsQuery = query(
    collection(db, 'users', uid, 'bookings'),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc')
  );
  const unsubBookings = onSnapshot(
    bookingsQuery,
    (snap) => {
      const list: ServiceBooking[] = snap.docs.map((docSnap) => {
        const d = docSnap.data();
        const ts =
          d.createdAt && typeof (d.createdAt as { toDate?: () => Date }).toDate === 'function'
            ? (d.createdAt as { toDate: () => Date }).toDate().toISOString()
            : '';
        return {
          id: String(d.bookingCode || docSnap.id),
          serviceId: String(d.serviceId || ''),
          serviceName: String(d.serviceName || ''),
          storeId: String(d.storeId || ''),
          storeName: String(d.storeName || ''),
          date: String(d.date || ''),
          timeSlot: String(d.timeSlot || ''),
          customerName: String(d.customerName || ''),
          email: String(d.email || ''),
          notes: String(d.notes || ''),
          status: d.status === 'Confirmed' ? 'Confirmed' : 'Pending',
          createdAt: ts,
        };
      });
      callbacks.onBookings(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, bookingsPath)
  );

  return () => {
    unsubUser();
    unsubPrivate();
    unsubOrders();
    unsubBookings();
  };
}
