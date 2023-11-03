
import React, { useState, useEffect, useRef } from "react";
import {
    Button,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    Pressable
} from 'react-native';

import MapView, {Marker, Callout, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';

import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

import {clearAsyncStorage, getDataAsyncStorage, storeDataAsyncStorage, storeDataAsyncStorageJSON} from '../utils/LocalStorage';

import CancelRideModal from "./CancelRideModal";


const requestLocationPermission = async () => {
    try {
        const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Geolocation Permission',
          message: 'Can we access your location?',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      console.log('granted', granted);
      if (granted === 'granted') {
        console.log('ACCESS_FINE_LOCATION is granted');
        return true;
      } else {
        console.log('ACCESS_FINE_LOCATION is not granted');
        return false;
      }
    } catch (err) {
      return false;
    }
};


const HomeScreen = ({route, navigation}) => {

    const [origin, setOrigin] = useState("");
    const [destination, setDestination] = useState("");

    const [boolSearchRide, setBoolSearchRide] = useState(false);

    const [userCurrentLocation, setUserCurrentLocation] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    })

    const [userDestinationLocation, setUserDestinationLocation] = useState({
        latitude: 0,
        longitude: 0,
    })

    getLocationUser = async () => {
        await Geolocation.getCurrentPosition(
            position => {
                const {latitude, longitude} = position.coords;
                setUserCurrentLocation((prevState) => ({...prevState, latitude: latitude, longitude: longitude}))
            },
            error => {
                console.log(error);
            }
        )
    }

    useEffect(() => {
        requestLocationPermission();
        getLocationUser()
    }, []);

    const mapRef = useRef(null);

    const [boolTraceRoute, setBoolTraceRoute] = useState(false);

    const traceRoute = () => {
        mapRef.current?.fitToCoordinates([userCurrentLocation, userDestinationLocation], {edgePadding: { top: 80, right: 80, bottom: 80, left: 80 }})
    }

    const [distance, setDistance] = useState(0);
    const [duration, setDuration] = useState(0);

    const calculateDistanceDuration = (args) => {

        if (args) {
            
            const calculatedDistance = args.distance;
            const calculatedDuration = args.duration;

            setDistance(calculatedDistance)
            setDuration(calculatedDuration)
        }
    }

    const [drawNavigation, setDrawNavigation] = useState(false);
    const [traceRouteBtnStatus, setTraceRouteBtnStatus] = useState(0);

    useEffect(() => {

        if (origin && destination)
            setTraceRouteBtnStatus(1)

    }, [origin, destination]);

    const [modalVisible, setModalVisible] = useState(false);

    React.useEffect(() => {
        if (route.params?.cancelled) {
            setModalVisible(current => true);
            console.log(modalVisible);
        }
    }, [route.params?.cancelled]);

    return (    
        <View>
            <Modal
                animationType='fade'
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible)
                }}
            >
                <View style={homeScreenStyles.modalViewContainer}>
                    <View style={homeScreenStyles.modelContentContainer}>
                        <View style={homeScreenStyles.modelIconImageContainer}>
                            <Image style={homeScreenStyles.modelIconImage} source={require('../../../assets/icons/alert_medium.png')}/>
                        </View>
                        <View style={homeScreenStyles.modalCancelContainer}>
                            <View style={homeScreenStyles.cancelWarningViewContainer}>
                                <View style={homeScreenStyles.CancelWarningViewTitle}>
                                    <Text style={homeScreenStyles.cancelWarningTitle}>Do you want to cancel this ride?</Text>
                                </View>
                                <View style={homeScreenStyles.CancelWarningViewDesc}>
                                    <Text style={homeScreenStyles.cancelWarningDesc}>make sure you want to cancel the ride.</Text>
                                </View>
                            </View>
                        </View>
                        <View style={homeScreenStyles.modelCancelBtnContainer}>
                            <TouchableOpacity style={homeScreenStyles.dontCancelOptionBtnContainer} onPress={() => {
                                setModalVisible(!modalVisible)
                            }}>
                                <View style={homeScreenStyles.dontcancelOptionView}>
                                    <Text style={homeScreenStyles.dontcancelOptionText}>No</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={homeScreenStyles.cancelOptionBtnContainer} onPress={() => {
                                setModalVisible(!modalVisible)
                                setOrigin("")
                                setDestination("")
                                setUserDestinationLocation({
                                    latitude: 0,
                                    longitude: 0,
                                });
                                getLocationUser();
                            }}>
                                <View style={homeScreenStyles.cancelOptionView}>
                                    <Text style={homeScreenStyles.cancelOptionText}>Yes, Cancel</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            <MapView 
                ref={mapRef}
                style={homeScreenStyles.map} 
                region={userCurrentLocation}
                zoomEnabled
                provider={PROVIDER_GOOGLE}
            >
                <Marker coordinate={userCurrentLocation} pinColor={'#2BCE70'}/>
                {userDestinationLocation.latitude != 0 && <Marker coordinate={userDestinationLocation} pinColor={'#2BCE70'}/>}
                {origin && destination && <MapViewDirections
                    origin={userCurrentLocation}
                    destination={userDestinationLocation}
                    apikey={'AIzaSyDqcYoZHkHcv14Q3vGAjIpJ0cc3Svnvd7Y'}
                    strokeWidth={6}
                    strokeColor='#2BCE70'
                    onReady={calculateDistanceDuration}
                />}
            </MapView>
            <View style={[homeScreenStyles.mapOptionsView]}>
                <TouchableOpacity onPress={() => setBoolSearchRide(!boolSearchRide)}>
                    <View style={homeScreenStyles.mapOptionsItemsView}>
                    <Image
                        style={homeScreenStyles.mapOptionsItemsImage}
                        source={require('../../../assets/maps_assets/cursor_48.png')}
                    />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                    if (!(userCurrentLocation.latitudeDelta < 0.01) || !(userCurrentLocation.longitudeDelta < 0.01))
                        setUserCurrentLocation((prevState) => ({
                            ...prevState,
                            latitudeDelta: prevState.latitudeDelta / 2,
                            longitudeDelta: prevState.longitudeDelta / 2
                        }))
                }}>
                    <View style={homeScreenStyles.mapOptionsItemsView}>
                    <Image
                        style={homeScreenStyles.mapOptionsItemsImage}
                        source={require('../../../assets/maps_assets/plus_48.png')}
                    />
                    </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {

                if (!(userCurrentLocation.latitudeDelta > 1) || !(userCurrentLocation.longitudeDelta > 1))
                    setUserCurrentLocation((prevState) => ({
                        ...prevState,
                        latitudeDelta: prevState.latitudeDelta * 2,
                        longitudeDelta: prevState.longitudeDelta * 2
                    }))

                    navigation.navigate('SelectRide')
                }}>
                    <View style={homeScreenStyles.mapOptionsItemsView}>
                    <Image
                        style={homeScreenStyles.mapOptionsItemsImage}
                        source={require('../../../assets/maps_assets/minus_48.png')}
                    />
                    </View>
                </TouchableOpacity>
            </View>
            { boolSearchRide && <View style={homeScreenStyles.currentLocationView}>
                <GooglePlacesAutocomplete
                    placeholder='Current Location'
                    fetchDetails={true}
                    textInputProps={{
                        placeholderTextColor: 'black',
                        returnKeyType: "search",
                        errorStyle: { color: 'red' },
                    }}
                    styles={{
                        textInputContainer: {
                            borderWidth: 1,
                            marginBottom: 20,
                        },
                        textInput: {
                            height: 38,
                            color: '#5d5d5d',
                            fontSize: 16,
                        },
                        predefinedPlacesDescription: {
                        color: '#1faadb',
                        },
                        description : {color : 'black'}
                    }}
                    onPress={(data, details = null) => {
                        setUserCurrentLocation((prevState) => ({
                            ...prevState,
                            latitude: details?.geometry.location.lat,
                            longitude: details?.geometry.location.lng
                        }))
                        
                        const complete_address = details?.formatted_address;

                        const location = complete_address.split(",")[0] + "," + complete_address.split(",")[1]

                        setOrigin(location)

                        // console.log(userCurrentLocation);
                    }}
                    query={{
                        key: 'AIzaSyDqcYoZHkHcv14Q3vGAjIpJ0cc3Svnvd7Y',
                        language: 'en',
                        type: '(cities)'
                    }}
                    debounce={200}
                />
                <GooglePlacesAutocomplete
                    placeholder='Destination Location'
                    fetchDetails={true}
                    textInputProps={{
                        placeholderTextColor: 'black',
                        returnKeyType: "search",
                        errorStyle: { color: 'red' },
                    }}
                    styles={{
                        textInputContainer: {
                            borderWidth: 1
                        },
                        textInput: {
                            height: 38,
                            color: '#5d5d5d',
                            fontSize: 16,
                        },
                        predefinedPlacesDescription: {
                        color: '#1faadb',
                        },
                        description : {color : 'black'}
                    }}
                    onPress={(data, details = null) => {
                        setUserDestinationLocation((prevState) => ({
                            ...prevState,
                            latitude: details?.geometry.location.lat,
                            longitude: details?.geometry.location.lng
                        }))

                        // console.log(userDestinationLocation);

                        const complete_address = details?.formatted_address;

                        const location = complete_address.split(",")[0] + "," + complete_address.split(",")[1];

                        setDestination(location)
                    }}
                    query={{
                        key: 'AIzaSyDqcYoZHkHcv14Q3vGAjIpJ0cc3Svnvd7Y',
                        language: 'en',
                        type: '(cities)'
                    }}
                    debounce={200}
                />
                <TouchableOpacity
                    disabled={traceRouteBtnStatus == 0 ? true : false}
                    style={[
                        homeScreenStyles.traceRouteBtn, 
                        traceRouteBtnStatus == 1 ? {backgroundColor: '#2BCE70'}: null
                    ]} 
                    onPress={() => {
                        setBoolTraceRoute(true)
                        traceRoute();

                        setBoolSearchRide(false);
                        setDrawNavigation(true);

                        clearAsyncStorage();

                        storeDataAsyncStorage('origin', origin);
                        storeDataAsyncStorage('destination', destination);
                        storeDataAsyncStorage('distance', String(distance.toFixed(2)));
                        storeDataAsyncStorage('duration', String(duration.toFixed(0)));

                        console.log("Distance: ", distance);
                        console.log("Duration: ", duration);
                    
                        navigation.navigate('Booking', {
                                navigationOrigin: 'Home', 
                                origin: origin, 
                                destination: destination,
                                distance: distance,
                                duration: duration,
                                ride_pickup_location: {
                                    latitude: userCurrentLocation.latitude,
                                    longitude: userCurrentLocation.longitude
                                },
                                ride_destination_location: {
                                    latitude: userDestinationLocation.latitude,
                                    longitude: userDestinationLocation.longitude
                                }
                        })
                    }}
                >
                    <View style={homeScreenStyles.traceRouteView}>
                        <Text style={[homeScreenStyles.traceRouteText, traceRouteBtnStatus == 1 ? {color: 'white'} : null]}>Trace Route</Text>
                    </View>
                </TouchableOpacity>
            </View>}
            {!boolSearchRide && <View style={homeScreenStyles.drawerView}>
                <TouchableOpacity style={homeScreenStyles.openDrawerBtn} onPress={() => navigation.openDrawer()}>
                    <View style={homeScreenStyles.openDrawerView}>
                        <Image style={homeScreenStyles.openDrawerImage} source={require('../../../assets/drawer_icons/hamburger_small.png')}/>
                    </View>
                </TouchableOpacity>
            </View>}
        </View>
    );
}


const homeScreenStyles = StyleSheet.create({
    modalViewContainer: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignContent: 'center',
        backgroundColor: 'rgba(247, 247, 247, 0.7)',
    },
    modelContentContainer: {
        backgroundColor: '#FFFFFF',
        width: '80%',
        height: 300,
        marginTop: 150,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 100,
    },
    modelIconImageContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15
    },
    modelIconImage: {
        width: 40,
        height: 40,
    },
    modelContentBreakdownContainer: {
        marginTop: 15
    },
    contentBreakdown: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 20,
        paddingRight: 20,
        marginBottom: 15
    },
    breakdownTitle: {
        fontSize: 18,
        fontWeight: 'normal'
    },
    breakdownCost: {
        fontSize: 18,
        fontWeight: 'normal'
    },
    modelPayBtnContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
    },
    PayBtnContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 10,
        width: 140,
        height: 50,
        backgroundColor: '#41D37F',
        borderRadius: 25
    },
    PayBtnText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF'
    },
    modalCancelContainer: {
        marginTop: 30,
        marginBottom: 30
    },
    cancelWarningViewContainer: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    CancelWarningViewTitle: {
        marginLeft: 12,
        marginRight: 12
    },
    cancelWarningTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'black'
    },
    CancelWarningViewDesc: {
        marginLeft: 10,
        marginRight: 10,
        marginTop: 20
    },
    cancelWarningDesc: {
        fontSize: 14,
        fontWeight: 'normal'
    },
    modelCancelBtnContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
    },
    dontCancelOptionBtnContainer: {
        width: 120,
        height: 45,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#40D27D',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 3,
    },
    dontcancelOptionView: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 7
    },
    dontcancelOptionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#40D27D'
    },
    cancelOptionView: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        paddingTop: 7
    },
    cancelOptionBtnContainer: {
        width: 120,
        height: 45,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        borderWidth: 3,
        borderColor: '#FF0000',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 3,
    },
    cancelOptionText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF0000'
    },
    drawerView: {
        position: 'absolute',
        marginLeft: 20,
        marginTop: 20
    },
    openDrawerBtn: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center',
        width: 60,
        height: 60,
        borderRadius: 60/2,
        backgroundColor: 'white',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    map: {
        width: '100%',
        height: '100%'
    },
    mapOptionsView: {
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        right: 20,
        marginTop: 500
    },
    mapOptionsItemsView: {
        display: 'flex',
        textAlign: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        backgroundColor: '#2BCE70',
        marginTop: 15,
        padding: 5,
        borderRadius: 8
    },
    mapOptionsItemsImage: {
        width: 37,
        height: 37
    },
    currentLocationView: {
        position: 'absolute',
        width: '90%',
        marginTop: 20,
        marginLeft: 20,
        backgroundColor: 'white',
        shadowColor: 'black',
        shadowOffset: {width: 2, height: 2},
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 4,
        padding: 8,
        borderRadius: 8
    },
    traceRouteBtn: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignContent: 'center',
        marginTop: 20,
        backgroundColor: '#F1F1F1',
    },
    traceRouteView: {
        padding: 10
    },
    traceRouteText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#cccccc'
    }
});

export default HomeScreen;