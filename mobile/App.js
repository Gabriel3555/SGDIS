import { StyleSheet, Text, View, Image, Button, TextInput } from 'react-native';
import Login from './Screens/Auth/Login';



export default function App() {

  return (
    
    <View style={styles.container}>
      <Login/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'start',
    justifyContent: 'center',
    padding: 20
  },
  
});