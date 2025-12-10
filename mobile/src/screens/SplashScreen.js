import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

const SplashScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>DCCB</Text>
            <Text style={styles.subtitle}>Loan Management System</Text>
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 32,
    },
    loader: {
        marginTop: 20,
    },
});

export default SplashScreen;
