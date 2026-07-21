(function () {
  'use strict';

  function updateCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
    });
  }

  function initVariantPicker(form) {
    var variantScript = form.querySelector('[data-product-variants]');
    if (!variantScript) return;

    var variants = JSON.parse(variantScript.textContent);
    var variantIdInput = form.querySelector('[data-variant-id-input]');
    var priceEl = form.closest('.main-product').querySelector('[data-product-price]');
    var addButton = form.querySelector('[data-add-to-cart]');
    var addButtonText = form.querySelector('[data-add-to-cart-text]');

    function currentSelection() {
      var selected = {};
      form.querySelectorAll('[data-option-index]:checked').forEach(function (input) {
        selected[input.dataset.optionIndex] = input.value;
      });
      return selected;
    }

    function findMatchingVariant() {
      var selected = currentSelection();
      return variants.find(function (variant) {
        return Object.keys(selected).every(function (index) {
          return variant['option' + index] === selected[index];
        });
      });
    }

    function formatMoney(cents) {
      return '¥' + Math.round(cents / 100).toLocaleString('ja-JP');
    }

    function applyVariant(variant) {
      if (!variant) return;
      variantIdInput.value = variant.id;

      if (priceEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          priceEl.innerHTML =
            '<span class="main-product__price--sale">' + formatMoney(variant.price) + '</span>' +
            '<span class="main-product__price--compare">' + formatMoney(variant.compare_at_price) + '</span>';
        } else {
          priceEl.innerHTML = '<span>' + formatMoney(variant.price) + '</span>';
        }
      }

      if (variant.featured_image) {
        var mainImage = document.getElementById('ProductMainImage');
        if (mainImage) mainImage.src = variant.featured_image.src;
      }

      if (addButton) {
        addButton.disabled = !variant.available;
        if (addButtonText) {
          addButtonText.textContent = variant.available ? 'カートに追加' : '売り切れ';
        }
      }
    }

    form.querySelectorAll('[data-option-index]').forEach(function (input) {
      input.addEventListener('change', function () {
        applyVariant(findMatchingVariant());
      });
    });
  }

  function initQuantitySelector(scope) {
    scope.querySelectorAll('.quantity-selector').forEach(function (selector) {
      var input = selector.querySelector('input[type="number"]');
      var decrease = selector.querySelector('[data-quantity-decrease]');
      var increase = selector.querySelector('[data-quantity-increase]');
      if (!input) return;

      decrease && decrease.addEventListener('click', function () {
        var value = Math.max(1, parseInt(input.value || '1', 10) - 1);
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
      increase && increase.addEventListener('click', function () {
        var value = parseInt(input.value || '1', 10) + 1;
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  }

  function initAddToCartForm(form) {
    form.addEventListener('submit', function (event) {
      if (!('fetch' in window)) return;
      event.preventDefault();

      var addButton = form.querySelector('[data-add-to-cart]');
      var successMessage = form.querySelector('[data-cart-success]');
      var formData = new FormData(form);

      if (addButton) addButton.disabled = true;

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      })
        .then(function (response) {
          if (!response.ok) throw new Error('add to cart failed');
          return fetch('/cart.js', { headers: { Accept: 'application/json' } });
        })
        .then(function (response) { return response.json(); })
        .then(function (cart) {
          updateCartCount(cart.item_count);
          if (successMessage) {
            successMessage.hidden = false;
            setTimeout(function () { successMessage.hidden = true; }, 3000);
          }
        })
        .catch(function () {
          form.submit();
        })
        .finally(function () {
          if (addButton) addButton.disabled = false;
        });
    });
  }

  function initCartQuantityInputs() {
    document.querySelectorAll('.cart-table__quantity').forEach(function (input) {
      input.addEventListener('change', function () {
        input.closest('form').submit();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-product-form]').forEach(function (form) {
      initVariantPicker(form);
      initAddToCartForm(form);
    });
    initQuantitySelector(document);
    initCartQuantityInputs();
  });
})();
