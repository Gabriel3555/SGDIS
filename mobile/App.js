import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavegation from './src/Navigation/AuthNavegation';
import MainNavigator from './src/Navigation/MainNavigator';
import { navigationRef } from './src/Navigation/NavigationService';
import ChangePasswordScreen from './Screens/Auth/ScreenUser/ChangePasswordScreen';
import ChangePhotoScreen from './Screens/Auth/ScreenUser/ChangePhotoScreen';



const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavegation} />
        <Stack.Screen name="Main" component={MainNavigator} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="ChangePhoto" component={ChangePhotoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}