import { Feather } from "@expo/vector-icons";
import { Video } from "expo-av";
import React, { useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MentionsTextInput from "react-native-mentions";
import { Snackbar } from "react-native-paper";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { fetchUserPosts, sendNotification } from "../../../redux/actions/index";
import { container, navbar, text, utils } from "../../styles";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "../../../firebaseConfig";
import {
  getFirestore,
  collection,
  query,
  limit,
  doc,
  where,
  addDoc,
  getDocs,
  FieldValue,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const storage = getStorage(firebaseApp);

function Save(props) {
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [data, setData] = useState("");
  const [keyword, setKeyword] = useState("");

  useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Feather
          style={navbar.image}
          name="check"
          size={24}
          color="green"
          onPress={() => {
            uploadImage();
          }}
        />
      ),
    });
  }, [caption]);

  const uploadImage = async () => {
    if (uploading) {
      return;
    }
    setUploading(true);
    let downloadURLStill = null;
    let downloadURL = await SaveStorage(
      props.route.params.source,
      `post/${auth.currentUser.uid}/${Math.random().toString(36)}`
    );

    if (props.route.params.imageSource != null) {
      downloadURLStill = await SaveStorage(
        props.route.params.imageSource,
        `post/${auth.currentUser.uid}/${Math.random().toString(36)}`
      );
    }
    savePostData(downloadURL, downloadURLStill);
  };

  const SaveStorage = async (image, path) => {
    if (image == "default") {
      return "";
    }
    const storageRef = ref(storage, path);
    const response = await fetch(image);
    const blob = await response.blob();
    const task = uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(task.snapshot.ref);
    return downloadURL;
  };

  const savePostData = async (downloadURL, downloadURLStill) => {
    let object = {
      downloadURL,
      caption,
      likesCount: 0,
      commentsCount: 0,
      type: props.route.params.type,
      creation: FieldValue.serverTimestamp,
    };
    if (downloadURLStill != null) {
      object.downloadURLStill = downloadURLStill;
    }

    const postsCollectionRef = collection(db, "posts");
    const docRef = doc(postsCollectionRef, auth.currentUser.uid);
    const userPostsCollectionRef = collection(docRef, "userPosts");
    try {
      await addDoc(userPostsCollectionRef, object);
      props.fetchUserPosts();
      props.navigation.popToTop();
    } catch (error) {
      setUploading(false);
      setError(true);
    }

    var pattern = /\B@[a-z0-9_-]+/gi;
    let array = caption.match(pattern);

    if (array !== null) {
      for (let i = 0; i < array.length; i++) {
        const usersCollectionRef = collection(db, "users");
        const q = query(
          usersCollectionRef,
          where("username", "==", array[i].substring(1))
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          props.sendNotification(
            doc.data().notificationToken,
            "New tag",
            `${props.currentUser.name} Tagged you in a post`,
            { type: 0, user: auth.currentUser.uid }
          );
        });
      }
    }
  };

  const renderSuggestionsRow = ({ item }, hidePanel) => {
    return (
      <TouchableOpacity
        onPress={() => onSuggestionTap(item.username, hidePanel)}
      >
        <View style={styles.suggestionsRowContainer}>
          <View style={styles.userIconBox}>
            <Image
              style={{ aspectRatio: 1 / 1, height: 45 }}
              source={{
                uri: item.image,
              }}
            />
          </View>
          <View style={styles.userDetailsBox}>
            <Text style={styles.displayNameText}>{item.name}</Text>
            <Text style={styles.usernameText}>@{item.username}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const onSuggestionTap = (username, hidePanel) => {
    hidePanel();
    const comment = caption.slice(0, -keyword.length);
    setCaption(comment + "@" + username + " ");
  };

  const callback = async (keyword) => {
    setKeyword(keyword);
    const usersCollectionRef = collection(db, "users");
    const q = query(
      usersCollectionRef,
      where("username", ">=", keyword.substring(1)),
      limit(10)
    );
    const snapshot = await getDocs(q);
    let result = snapshot.docs.map((doc) => {
      const data = doc.data();
      const id = doc.id;
      return { id, ...data };
    });
    setData(result);
  };
  return (
    <View style={[container.container, utils.backgroundWhite]}>
      {uploading ? (
        <View
          style={[
            container.container,
            utils.justifyCenter,
            utils.alignItemsCenter,
          ]}
        >
          <ActivityIndicator style={utils.marginBottom} size="large" />
          <Text style={[text.bold, text.large]}>Upload in progress...</Text>
        </View>
      ) : (
        <View style={[container.container]}>
          <View
            style={[
              container.container,
              utils.backgroundWhite,
              utils.padding15,
            ]}
          >
            <View style={[{ marginBottom: 20, width: "100%" }]}>
              <MentionsTextInput
                textInputStyle={{
                  borderColor: "#ebebeb",
                  borderWidth: 1,
                  padding: 5,
                  fontSize: 15,
                  width: "100%",
                }}
                suggestionsPanelStyle={{
                  backgroundColor: "rgba(100,100,100,0.1)",
                }}
                loadingComponent={() => (
                  <View
                    style={{
                      flex: 1,
                      width: 200,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator />
                  </View>
                )}
                textInputMinHeight={30}
                textInputMaxHeight={80}
                trigger={"@"}
                triggerLocation={"new-word-only"} // 'new-word-only', 'anywhere'
                value={caption}
                onChangeText={setCaption}
                triggerCallback={callback.bind(this)}
                renderSuggestionsRow={renderSuggestionsRow.bind(this)}
                suggestionsData={data}
                keyExtractor={(item, index) => item.username}
                suggestionRowHeight={45}
                horizontal={true}
                MaxVisibleRowCount={3}
              />
            </View>
            <View>
              {props.route.params.type ? (
                <Image
                  style={container.image}
                  source={{ uri: props.route.params.source }}
                  style={{ aspectRatio: 1 / 1, backgroundColor: "black" }}
                />
              ) : (
                <Video
                  source={{ uri: props.route.params.source }}
                  shouldPlay={true}
                  isLooping={true}
                  resizeMode="cover"
                  style={{ aspectRatio: 1 / 1, backgroundColor: "black" }}
                />
              )}
            </View>
          </View>
          <Snackbar
            visible={error}
            duration={2000}
            onDismiss={() => setError(false)}
          >
            Something Went Wrong!
          </Snackbar>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    height: 300,
    justifyContent: "flex-end",
    paddingTop: 100,
  },
  suggestionsRowContainer: {
    flexDirection: "row",
  },
  userAvatarBox: {
    width: 35,
    paddingTop: 2,
  },
  userIconBox: {
    height: 45,
    width: 45,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#54c19c",
  },
  usernameInitials: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  userDetailsBox: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 10,
    paddingRight: 15,
  },
  displayNameText: {
    fontSize: 13,
    fontWeight: "500",
  },
  usernameText: {
    fontSize: 12,
    color: "rgba(0,0,0,0.6)",
  },
});

const mapStateToProps = (store) => ({
  currentUser: store.userState.currentUser,
});

const mapDispatchProps = (dispatch) =>
  bindActionCreators({ fetchUserPosts, sendNotification }, dispatch);

export default connect(mapStateToProps, mapDispatchProps)(Save);
