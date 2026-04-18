import { useEffect } from "react";
import styles from "./Modal.module.scss";
import PropTypes from "prop-types";

function Modal({ isOpen = false, children, onRequestClose, title }) {
  useEffect(() => {
    const handle = (e) => {
      if (e.code === "Escape") onRequestClose?.();
    };
    if (isOpen) document.addEventListener("keyup", handle);
    return () => document.removeEventListener("keyup", handle);
  }, [isOpen, onRequestClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.content}>
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <button className={styles.closeBtn} onClick={onRequestClose}>
            &times;
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
      <div className={styles.overlay} onClick={onRequestClose} />
    </div>
  );
}

Modal.propTypes = {
  isOpen: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onRequestClose: PropTypes.func,
  title: PropTypes.string,
};

export default Modal;
