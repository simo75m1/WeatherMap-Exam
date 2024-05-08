import { useState, useEffect, useRef } from 'react';
import { Image, StyleSheet, Text, View, Button, TextInput, Alert, FlatList, TouchableOpacity, Modal } from 'react-native';
import MapView, {Marker} from 'react-native-maps'
import * as Location from 'expo-location'


export default function App() {
  const [weather, setWeather] = useState(null)
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState({
    latitude:40,
    longitude:-73,
    latitudeDelta:20, //Hvor mange længde og breddegradder skal vises på kortet
    longitudeDelta:20 //Mindre tal = mere zoomet ind. 
  })

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
          latitudeDelta: 20,
          longitudeDelta: 20
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
async function getWeather(){
  console.log("Fetching weather")
  //setWeather
  openModal()
}
  async function openModal() {
    //Fetch data from weather api

    setModalVisible(true);
  };
  
  function closeModal() {
    setModalVisible(false);
    saveImage();
  };


  return (
    <View style={styles.container}>
      <MapView 
      style={styles.map}
      region={region}
      onLongPress={getWeather}
      ref = {mapView}></MapView>
    <PopupModal visible={modalVisible} onClose={closeModal} weatherData={weather}/>

    </View>
  );
}


const PopupModal = ({visible, onClose}) => {

  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
          <Text>Add image to this location</Text>
          <Button title="Add image"/>
          <Button title="Close" onPress={onClose} />
    
        </View>
      </View>
    </Modal>
  );
};

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
