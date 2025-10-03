import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../../Screens/Auth/Login';
import RegisterScreen from '../../Screens/Auth/Register';

const Stack = createNativeStackNavigator();

export default function AuthNavegation() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" 
            component={Login} />


            <Stack.Screen name="Register" 
            component={RegisterScreen} />
        </Stack.Navigator>
    )

}