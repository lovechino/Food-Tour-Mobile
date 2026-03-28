/**
 * hooks/useGeolocation.ts
 * Why: Tách permission request + GPS logic khỏi AiNearbyScreen (SRP).
 */
import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export interface GeoLocation {
    latitude: number;
    longitude: number;
}

interface GeoState {
    location: GeoLocation | null;
    errorMsg: string | null;
    isLoading: boolean;
}

const ERROR_PERMISSION = 'Ứng dụng cần quyền truy cập vị trí để tìm quán ăn quanh bạn!';
const ERROR_GPS = 'Không thể định vị được điện thoại của bạn. Hãy bật GPS và thử lại!';

export function useGeolocation(onLocated?: (loc: GeoLocation) => void) {
    const [state, setState] = useState<GeoState>({
        location: null, errorMsg: null, isLoading: true,
    });

    useEffect(() => {
        (async () => {
            try {
                const hasPermission = await requestPermission();
                if (!hasPermission) {
                    setState({ location: null, isLoading: false, errorMsg: ERROR_PERMISSION });
                    return;
                }
                Geolocation.getCurrentPosition(
                    (pos) => {
                        const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                        setState({ location: loc, isLoading: false, errorMsg: null });
                        onLocated?.(loc);
                    },
                    () => setState({ location: null, isLoading: false, errorMsg: ERROR_GPS }),
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            } catch {
                setState({ location: null, isLoading: false, errorMsg: ERROR_GPS });
            }
        })();
    }, []);

    return state;
}

async function requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
                title: 'Quyền truy cập vị trí',
                message: 'Ứng dụng cần quyền truy cập vị trí để tìm quán ăn quanh bạn!',
                buttonNeutral: 'Hỏi lại sau',
                buttonNegative: 'Hủy',
                buttonPositive: 'Đồng ý',
            },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    const auth = await Geolocation.requestAuthorization('whenInUse');
    return auth === 'granted';
}
