import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Button } from 'react-native';

/**
 * Simple Test App - Verify Expo is Working
 * This is a minimal version to test if the app loads in Expo Go
 */
const SimpleTestApp = () => {
    const [counter, setCounter] = React.useState(0);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.title}>✅ DCCB Loan Management</Text>
                <Text style={styles.subtitle}>Mobile App - Test Mode</Text>

                <View style={styles.card}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={styles.value}>App Loaded Successfully! 🎉</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Backend URL:</Text>
                    <Text style={styles.value}>http://192.168.0.106:8001</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Platform Support:</Text>
                    <Text style={styles.value}>✅ iOS & Android</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Test Counter:</Text>
                    <Text style={styles.counterValue}>{counter}</Text>
                    <Button
                        title="Increment Counter"
                        onPress={() => setCounter(counter + 1)}
                        color="#4CAF50"
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        ✅ If you can see this screen, Expo is working correctly!
                    </Text>
                    <Text style={styles.infoText}>
                        The full app with navigation and authentication is in App.js
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
        marginBottom: 5,
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    counterValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
        marginVertical: 20,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginVertical: 5,
    },
});

export default SimpleTestApp;
