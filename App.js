import { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Button, TextInput, Alert, FlatList, TouchableOpacity, Modal } from 'react-native';
import MapView, {Marker} from 'react-native-maps'
import * as Location from 'expo-location'


export default function App() {
  const [weather, setWeather] = useState(null)
  const [city, setCity] = useState(null)
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState({
    latitude:40,
    longitude:-73,
    latitudeDelta:20, //Hvor mange længde og breddegradder skal vises på kortet
    longitudeDelta:20 //Mindre tal = mere zoomet ind. 
  })
  const [errorMessageVisible, setErrorMessageVisible] = useState(false);

  const showErrorMessage = () => {
    setErrorMessageVisible(true);
    setTimeout(() => {
      setErrorMessageVisible(false);
    }, 3000); // Disappear after 3 seconds
  };
  const mapView = useRef(null) // useRef minder om useState, men forårsager ikke en re-render af siden.
  const locationSubscription = useRef(null)

  useEffect(() => {
    // Starte en listener
    async function startListener(){
      let {status} = await Location.requestForegroundPermissionsAsync()
      if(status !== 'granted'){
        alert("Fik ikke adgang til lokation")
        return
      }
      locationSubscription.current = await Location.watchPositionAsync({
        distanceInterval: 100,
        accuracy: Location.Accuracy.High //den højeste præcision
      }, (lokation) => {
          const newRegion = {
          latitude: lokation.coords.latitude,
          longitude: lokation.coords.longitude,
          latitudeDelta: 75,
          longitudeDelta: 75
          }
          setRegion(newRegion)
          if(mapView.current){
            mapView.current.animateToRegion(newRegion)
          }
        })
    }
    startListener()
    return () => {
      if(locationSubscription.current){
        locationSubscription.current.remove() //Turns off listener if it exists
      }
    }
  }, [])

  async function getCity(latitude, longitude) {
    try {
      const location = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (location && location.length > 0) {
        const { city, region, country } = location[0];
        return city || region || country;
      } else {
        return "City not found";
      }
    } catch (error) {
      console.error("Error getting city:", error);
      return null;
    }
  }

function fetchWeather(city){
  const tempWeather = fetch(`http://api.weatherapi.com/v1/current.json?key=f39b8ab4d2ca44b585e110853240905&q=${city}&aqi=no`)
  .then(res => res.json())
  .then(data => {
    if(data.current && data.current.temp_c !== undefined){
      const highestTemp = data.current.temp_c;
      return highestTemp;
    } else{
      return null
    }
    
  })
  return tempWeather
}

async function getWeather(data){
  const {latitude, longitude} = data.nativeEvent.coordinate
  try {
    const city = await getCity(latitude, longitude);
    console.log("Closest city:", city);
    
    const weather = await fetchWeather(city);
    
    if(weather === null){
      showErrorMessage()
    } else{
      setCity(city);
      setWeather(weather);
      openModal()
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
}
  async function openModal() {
    setModalVisible(true);
  };
  
  function closeModal() {
    setModalVisible(false);
  };


  return (
    <View style={styles.container}>
      <MapView 
      style={styles.map}
      region={region}
      onLongPress={getWeather}
      ref = {mapView}></MapView>
    <PopupModal visible={modalVisible} onClose={closeModal} weatherData={weather} cityData={city}/>
    {errorMessageVisible && <ErrorMessage />}
    </View>
  );
}


const PopupModal = ({visible, onClose, weatherData, cityData}) => {

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text>Current City:
          {cityData}
          </Text>
          <Text>Current Weather:
            {weatherData}
          </Text>
          
          <Button title="Close" onPress={onClose} />
    
        </View>
      </View>
    </Modal>
  );
};

// Error message component
const ErrorMessage = () => (
  <View style={{ position: 'absolute', top: 20, left: 0, right: 0, alignItems: 'center' }}>
    <Text style={{ backgroundColor: 'white', padding: 10, borderRadius: 5 }}>
      Could not fetch weather data
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,  
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%'
  },
});
