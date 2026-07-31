import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization

def build_lstm_model(input_shape):
    """
    Builds a multi-layer LSTM model for sequence prediction of risk.
    input_shape: (sequence_length, num_features)
    """
    model = Sequential([
        LSTM(64, return_sequences=True, input_shape=input_shape),
        BatchNormalization(),
        Dropout(0.3),
        
        LSTM(32, return_sequences=False),
        BatchNormalization(),
        Dropout(0.3),
        
        Dense(16, activation='relu'),
        Dense(1, activation='sigmoid') # Output is a risk probability between 0 and 1
    ])
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
    )
    
    return model

if __name__ == "__main__":
    # Test model build
    model = build_lstm_model((10, 4))
    model.summary()
