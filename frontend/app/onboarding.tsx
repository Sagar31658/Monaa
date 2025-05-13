import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  ViewToken,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../assets/images/welcom.png'),
    title: 'Always take control of your finance',
    subtitle: 'Finances must be arranged to set a better lifestyle in the future.',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.signIn} onPress={() => router.push('/login')}>
        <Text style={styles.signInText}>Sign in</Text>
      </TouchableOpacity>

      <FlatList
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item.image} style={styles.image} resizeMode="contain" />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      <View style={styles.indicatorContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, currentIndex === index && styles.activeDot]}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.getStarted} onPress={() => router.push('/register')}>
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  signIn: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  signInText: { color: '#888', fontSize: 16 },
  slide: { width, alignItems: 'center', justifyContent: 'center', padding: 20 },
  image: { width: 300, height: 300, marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', paddingHorizontal: 10 },
  indicatorContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  dot: { height: 8, width: 8, borderRadius: 4, backgroundColor: '#ccc', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#00C781' },
  getStarted: {
    backgroundColor: 'black',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  getStartedText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
