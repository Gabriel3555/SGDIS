import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../../Screens/Auth/Login';
import RegisterScreen from '../../Screens/Auth/Register';
import { useTheme } from '../ThemeContext';

const Stack = createNativeStackNavigator();

export default function AuthNavegation() {
    const { colors } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                },
                headerTintColor: colors.text,
                headerTitleStyle: {
                    color: colors.text,
                },
            }}
        >
            <Stack.Screen name="Login"
            component={Login} />


            <Stack.Screen name="Register"
            component={RegisterScreen} />
        </Stack.Navigator>
    )

}