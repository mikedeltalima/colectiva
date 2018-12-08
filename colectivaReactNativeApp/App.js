import React from 'react';
import { Platform, StatusBar, StyleSheet, View } from 'react-native';
import { AppLoading, Asset, Font, Icon } from 'expo';
import AppNavigator from './navigation/AppNavigator';
import { Button } from 'react-native';
import Amplify, { Auth } from 'aws-amplify';
import aws_exports from './src/aws-exports';
Amplify.configure(aws_exports);
// import { SignUp, withAuthenticator } from 'aws-amplify-react-native';

import { SignUp, Authenticator } from 'aws-amplify-react-native';

class App extends React.Component {
    state = {
        isLoadingComplete: false,
    };

    render() {
        if (this.props.authState !== 'signedIn') {
            return null;
        }
        if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
            return (
                <AppLoading
                    startAsync={this._loadResourcesAsync}
                    onError={this._handleLoadingError}
                    onFinish={this._handleFinishLoading}
                />
            );
        } else {
            return (
                <View style={styles.container}>
                    {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
                    <AppNavigator />
                </View>
            );
        }
    }

    _loadResourcesAsync = async () => {
        return Promise.all([
            Asset.loadAsync([
                require('./assets/images/robot-dev.png'),
                require('./assets/images/robot-prod.png'),
            ]),
            Font.loadAsync({
                // This is the font that we are using for our tab bar
                ...Icon.Ionicons.font,
                // We include SpaceMono because we use it in HomeScreen.js. Feel free
                // to remove this if you are not using it in your app
                'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
            }),
        ]);
    };

    _handleLoadingError = error => {
        // In this case, you might want to report the error to your error
        // reporting service, for example Sentry
        console.warn(error);
    };

    _handleFinishLoading = () => {
        this.setState({ isLoadingComplete: true });
    };
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});

class MySignUp extends SignUp {
    async signIn() {
        const result = await Expo.Facebook.logInWithReadPermissionsAsync(
            '313019289545725',
            {
                permissions: ['public_profile', 'email'],
            },
        );
        console.log(result);
        const { type, token, expires_at: expires } = result;
        if (type === 'success') {
            const response = await fetch(
                `https://graph.facebook.com/me?access_token=${token}&fields=id,name,email,first_name,last_name`,
            );
            const user = await response.json();
            console.log(user);
            // sign in with federated identity
            const credentials = await Auth.federatedSignIn(
                'facebook',
                { token, expires },
                user,
            );
            const userDetails = await Auth.currentAuthenticatedUser();
            console.log('Current user info:', userDetails);
        }
    }

    render() {
        if (this.props.authState === 'signedIn') {
            return null;
        }
        return <Button title="FBSignIn" onPress={this.signIn.bind(this)} />;
    }
}

// export default withAuthenticator(App, true, [<MySignUp />]);

export default class AuthApp extends React.Component {
    render() {
        return (
            <Authenticator hideDefault={true}>
                <MySignUp />
                <App />
            </Authenticator>
        );
    }
}
